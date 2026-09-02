import { useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { wallClockPayload } from "../lib/wallClock.js";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-coral/50";

function pad(n) {
  return String(n).padStart(2, "0");
}

function from24Hour(hhmm) {
  const [hStr = "0", mStr = "0"] = String(hhmm || "").split(":");
  let hour24 = Number(hStr);
  if (!Number.isFinite(hour24)) hour24 = 0;
  const minute = Number(mStr);
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return {
    hour: String(hour12),
    minute: pad(Number.isFinite(minute) ? minute : 0),
    period,
  };
}

function to24Hour(hour, minute, period) {
  let hour24 = Number(hour);
  if (!Number.isFinite(hour24)) hour24 = 12;
  if (period === "AM") {
    if (hour24 === 12) hour24 = 0;
  } else if (hour24 !== 12) {
    hour24 += 12;
  }
  const mins = Number(minute);
  return `${pad(hour24)}:${pad(Number.isFinite(mins) ? mins : 0)}`;
}

function nowParts() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function partsFromIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowParts();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function SugarRecordModal({ reading, onClose, onSubmit }) {
  const defaults = reading ? partsFromIso(reading.recordedAt) : nowParts();
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [level, setLevel] = useState(
    reading?.level != null ? String(reading.level) : ""
  );
  const [insulinDose, setInsulinDose] = useState(
    reading?.insulinDose ? String(reading.insulinDose) : ""
  );
  const [mealTiming, setMealTiming] = useState(reading?.mealTiming || "before");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const clock = from24Hour(time);

  function setClock({ hour = clock.hour, minute = clock.minute, period = clock.period }) {
    setTime(to24Hour(hour, minute, period));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const numeric = Number(level);
    if (!date || !time || !Number.isFinite(numeric)) {
      setError("Fill date, time, and sugar level.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        ...wallClockPayload(date, time),
        level: numeric,
        mealTiming,
        insulinDose: insulinDose === "" ? 0 : Number(insulinDose),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog size="form" onClose={onClose}>
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-muted uppercase">
              My Health · Sugar
            </p>
            <h3 className="mt-1 text-xl font-semibold">
              {reading ? "Edit reading" : "Record sugar level"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-muted hover:bg-white/5"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Time</span>
              <div className="flex items-stretch gap-1.5">
                <select
                  value={clock.hour}
                  onChange={(e) => setClock({ hour: e.target.value })}
                  className={`${fieldClass} min-w-0 px-2`}
                  aria-label="Hour"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(
                    (h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    )
                  )}
                </select>
                <select
                  value={clock.minute}
                  onChange={(e) => setClock({ minute: e.target.value })}
                  className={`${fieldClass} min-w-0 px-2`}
                  aria-label="Minute"
                >
                  {Array.from({ length: 60 }, (_, i) => pad(i)).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="grid w-[72px] shrink-0 grid-rows-2 overflow-hidden rounded-xl border border-line">
                  {["AM", "PM"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setClock({ period: item })}
                      className={`text-[11px] font-semibold ${
                        clock.period === item
                          ? "bg-coral/15 text-ink"
                          : "bg-[#171c2a] text-muted hover:bg-white/5"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">
                Sugar level (mg/dL)
              </span>
              <input
                autoFocus
                type="number"
                min="20"
                max="800"
                step="1"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. 112"
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">
                Insulin dose (units)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={insulinDose}
                onChange={(e) => setInsulinDose(e.target.value)}
                placeholder="e.g. 8"
                className={fieldClass}
              />
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-xs text-muted">
              Before or after food
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "before", label: "Before food" },
                { id: "after", label: "After food" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMealTiming(item.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${
                    mealTiming === item.id
                      ? "border-coral/50 bg-coral/15 text-ink"
                      : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-coral">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !level}
              className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-[#2a1410] disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : reading
                  ? "Save changes"
                  : "Save reading"}
            </button>
          </div>
        </form>
    </Dialog>
  );
}
