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

const selectClass =
  "w-full min-w-[4.5rem] rounded-xl border border-line bg-[#171c2a] px-2.5 py-2.5 text-sm tabular-nums outline-none focus:border-coral/50 disabled:opacity-40";

/** Always-visible 12-hour hour, minute, and AM/PM fields. */
export function ClockFields12({ value = "", onChange, disabled = false }) {
  const clock = parse12(value);

  function patch({ hour = clock.hour, minute = clock.minute, ampm = clock.ampm }) {
    if (disabled) return;
    onChange?.(to24(hour, minute, ampm));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-medium text-ink/80">
            Hour
          </span>
          <select
            value={clock.hour}
            disabled={disabled}
            aria-label="Hour"
            onChange={(e) => patch({ hour: e.target.value })}
            className={selectClass}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-medium text-ink/80">
            Minute
          </span>
          <select
            value={clock.minute}
            disabled={disabled}
            aria-label="Minute"
            onChange={(e) => patch({ minute: e.target.value })}
            className={selectClass}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <div className="min-w-0">
          <span className="mb-1.5 block text-[11px] font-medium text-ink/80">
            AM / PM
          </span>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line">
            {["AM", "PM"].map((part) => (
              <button
                key={part}
                type="button"
                disabled={disabled}
                onClick={() => patch({ ampm: part })}
                className={`py-2.5 text-xs font-semibold disabled:opacity-40 ${
                  clock.ampm === part
                    ? "bg-coral/18 text-ink"
                    : "bg-[#171c2a] text-muted hover:bg-white/5"
                }`}
              >
                {part}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-4 text-muted">
        12-hour time: first box is the hour (1–12), second is minutes.
      </p>
    </div>
  );
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
  const [open, setOpen] = useState(false);
  const clock = parse12(value);
  const display = value ? `${clock.hour}:${clock.minute} ${clock.ampm}` : "Set time";

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (disabled) return;
    setOpen((prev) => !prev);
  }

  return (
    <div ref={wrapRef} className={`relative inline-flex shrink-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
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
          className="absolute right-0 top-full z-[70] mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-line bg-[#1e2638] p-3 shadow-2xl ring-1 ring-white/5"
        >
          <ClockFields12 value={value} onChange={onChange} />
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
