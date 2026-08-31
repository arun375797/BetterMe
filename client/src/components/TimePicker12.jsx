import { useEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export function parse12(time24) {
  if (!time24) return { hour: "12", minute: "00", ampm: "AM" };
  const [h, m] = time24.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return { hour: "12", minute: "00", ampm: "AM" };
  const ampm = h < 12 ? "AM" : "PM";
  const hour = String(h % 12 === 0 ? 12 : h % 12);
  const minute = String(m).padStart(2, "0");
  return { hour, minute, ampm };
}

export function to24(hour, minute, ampm) {
  let h = Number(hour || 12);
  const m = Number(minute || 0);
  if (ampm === "AM" && h === 12) h = 0;
  if (ampm === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Split an ISO / Date value into date (YYYY-MM-DD) and time (HH:mm) for form fields. */
export function duePartsFromIso(iso) {
  if (!iso) return { date: "", time: "" };
  const raw = String(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { date: raw, time: "" };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}


export default function TimePicker12({
  value = "",
  onChange,
  disabled = false,
  className = "",
}) {
  const wrapRef = useRef(null);
  const minutePanelRef = useRef(null);
  const initial = parse12(value);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("hour");
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [ampm, setAmpm] = useState(initial.ampm);
  const [draftHour, setDraftHour] = useState(null);

  useEffect(() => {
    const p = parse12(value);
    setHour(p.hour);
    setMinute(p.minute);
    setAmpm(p.ampm);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) {
        closePicker();
      }
    }
    function onKey(e) {
      if (e.key === "Escape") closePicker();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (step !== "minute" || !minutePanelRef.current) return;
    const active = minutePanelRef.current.querySelector("[data-active=true]");
    active?.scrollIntoView({ block: "nearest" });
  }, [step, minute]);

  function closePicker() {
    setOpen(false);
    setStep("hour");
    setDraftHour(null);
  }

  function openPicker() {
    if (disabled) return;
    if (open) {
      closePicker();
      return;
    }
    setOpen(true);
    setStep("hour");
    setDraftHour(null);
  }

  function selectHour(h) {
    setDraftHour(h);
    setHour(h);
    setStep("minute");
  }

  function selectMinute(m) {
    const chosenHour = draftHour || hour;
    setHour(chosenHour);
    setMinute(m);
    onChange(to24(chosenHour, m, ampm));
    closePicker();
  }

  function selectAmpm(next) {
    setAmpm(next);
    if (value || draftHour) {
      onChange(to24(draftHour || hour, minute, next));
    }
  }

  const previewHour = draftHour || hour;
  const display = open
    ? step === "hour"
      ? `Pick hour · ${ampm}`
      : `${previewHour}:${minute} ${ampm}`
    : value
      ? `${hour}:${minute} ${ampm}`
      : "Set time";

  return (
    <div ref={wrapRef} className={`relative inline-flex shrink-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex min-w-[7.5rem] items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs tabular-nums transition-colors ${
          disabled
            ? "cursor-not-allowed border-line/40 bg-white/5 text-muted opacity-50"
            : open
              ? "border-cyan/50 bg-cyan/8 text-ink ring-1 ring-cyan/30"
              : "border-line bg-white/5 text-muted hover:border-cyan/40 hover:text-ink"
        }`}
      >
        <span>{display}</span>
        {!disabled ? (
          <svg
            viewBox="0 0 16 16"
            className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>

      {open && !disabled ? (
        <div
          role="dialog"
          aria-label="Pick a time"
          className="absolute right-0 top-full z-[70] mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-[#1e2638] shadow-2xl ring-1 ring-white/5"
        >
          {/* Step indicator */}
          <div className="flex border-b border-line/60 bg-white/[0.03]">
            <button
              type="button"
              onClick={() => setStep("hour")}
              className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors ${
                step === "hour"
                  ? "border-b-2 border-cyan text-cyan"
                  : "text-muted hover:text-ink"
              }`}
            >
              1. Hour
            </button>
            <button
              type="button"
              onClick={() => draftHour && setStep("minute")}
              disabled={!draftHour && step === "hour"}
              className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors ${
                step === "minute"
                  ? "border-b-2 border-cyan text-cyan"
                  : draftHour
                    ? "text-muted hover:text-ink"
                    : "cursor-not-allowed text-muted/40"
              }`}
            >
              2. Minute
            </button>
          </div>

          <div className="p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted">
                {step === "hour" ? "Choose hour" : `${previewHour} · pick minutes`}
              </p>
              <div className="inline-flex rounded-full bg-white/5 p-0.5 text-[11px]">
                {["AM", "PM"].map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => selectAmpm(part)}
                    className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                      ampm === part
                        ? "bg-cyan/25 text-cyan"
                        : "text-muted hover:bg-white/8 hover:text-ink"
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>

            {step === "hour" ? (
              <div className="grid grid-cols-4 gap-1.5" role="listbox" aria-label="Hours">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    role="option"
                    aria-selected={h === hour}
                    onClick={() => selectHour(h)}
                    className={`rounded-xl px-2 py-2 text-sm font-medium tabular-nums transition-all ${
                      h === hour || h === draftHour
                        ? "bg-cyan/25 text-cyan ring-1 ring-cyan/40"
                        : "bg-white/4 text-muted hover:bg-cyan/12 hover:text-ink"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            ) : (
              <div
                ref={minutePanelRef}
                className="grid max-h-44 grid-cols-4 gap-1 overflow-y-auto pr-0.5"
                role="listbox"
                aria-label="Minutes"
                data-lenis-prevent
              >
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="option"
                    aria-selected={m === minute}
                    data-active={m === minute ? "true" : undefined}
                    onClick={() => selectMinute(m)}
                    className={`rounded-lg px-1.5 py-1.5 text-xs tabular-nums transition-all ${
                      m === minute
                        ? "bg-cyan/25 text-cyan ring-1 ring-cyan/40"
                        : "bg-white/4 text-muted hover:bg-cyan/12 hover:text-ink"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Combine date + optional time into a value for the API. */
export function buildDueIso(date, time24) {
  if (!date) return null;
  if (!time24) return date;
  return `${date}T${time24}:00`;
}
