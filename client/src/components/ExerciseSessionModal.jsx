import { useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { ClockFields12 } from "./TimePicker12.jsx";
import { wallClockPayload } from "../lib/wallClock.js";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-coral/50";

function pad(n) {
  return String(n).padStart(2, "0");
}

function nowParts() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function fromIso(iso) {
  if (!iso) return nowParts();
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function ExerciseSessionModal({
  kind,
  kindLabel,
  session,
  onClose,
  onSubmit,
}) {
  const editing = Boolean(session);
  const defaults = fromIso(session?.recordedAt);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [what, setWhat] = useState(session?.what || "");
  const [why, setWhy] = useState(session?.why || "");
  const [durationMinutes, setDurationMinutes] = useState(
    session?.durationMinutes ? String(session.durationMinutes) : ""
  );
  const [felt, setFelt] = useState(
    session?.felt != null ? String(session.felt) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!what.trim() || !why.trim() || !date || !time) {
      setError("Fill what you did, why, date, and time.");
      return;
    }
    const minutes = Number(durationMinutes);
    if (!Number.isFinite(minutes) || minutes < 1) {
      setError("Enter how many minutes you trained.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        kind,
        what: what.trim(),
        why: why.trim(),
        durationMinutes: minutes,
        felt: felt === "" ? null : Number(felt),
        ...wallClockPayload(date, time),
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
              My Health · Exercise
            </p>
            <h3 className="mt-1 text-xl font-semibold">
              {editing ? "Edit session" : `Log ${kindLabel}`}
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
          <div>
            <span className="mb-1.5 block text-xs text-muted">Time (12-hour)</span>
            <ClockFields12 value={time} onChange={setTime} />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">
              What did you do
            </span>
            <textarea
              autoFocus
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              rows={2}
              placeholder="e.g. Sun salutations, footwork drills, squats"
              className={`${fieldClass} resize-y`}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">
              Why this day
            </span>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={2}
              placeholder="e.g. Stiff back, match practice, build legs"
              className={`${fieldClass} resize-y`}
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">
                Minutes
              </span>
              <input
                type="number"
                min="1"
                max="600"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="45"
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">
                How it felt (1–10)
              </span>
              <input
                type="number"
                min="1"
                max="10"
                value={felt}
                onChange={(e) => setFelt(e.target.value)}
                placeholder="optional"
                className={fieldClass}
              />
            </label>
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
              disabled={saving}
              className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-[#2a1410] disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Save session"}
            </button>
          </div>
        </form>
    </Dialog>
  );
}
