import { useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { ClockFields12 } from "./TimePicker12.jsx";
import { wallClockPayload } from "../lib/wallClock.js";

const fieldClass = "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-cyan/50";

function pad(value) {
  return String(value).padStart(2, "0");
}

function parts(iso) {
  const date = iso ? new Date(iso) : new Date();
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export default function InsulinEntryModal({ entry, onClose, onSubmit }) {
  const initial = parts(entry?.recordedAt);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [dose, setDose] = useState(entry?.dose ? String(entry.dose) : "");
  const [kind, setKind] = useState(entry?.kind || "other");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const numeric = Number(dose);
    if (!date || !time || !Number.isFinite(numeric) || numeric <= 0) {
      setError("Fill the date, time, and insulin dose.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ ...wallClockPayload(date, time), dose: numeric, kind, notes });
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
          <p className="text-[11px] tracking-[0.18em] text-cyan uppercase">My Health · Insulin</p>
          <h3 className="mt-1 text-xl font-semibold">{entry ? "Edit insulin entry" : "Record insulin"}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-muted hover:bg-white/5">Close</button>
      </div>
      <form onSubmit={submit} className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Dose (units)</span>
            <input autoFocus type="number" min="0.5" max="200" step="0.5" value={dose} onChange={(event) => setDose(event.target.value)} placeholder="e.g. 8" className={fieldClass} required />
          </label>
        </div>
        <div>
          <span className="mb-1.5 block text-xs text-muted">Time (12-hour)</span>
          <ClockFields12 value={time} onChange={setTime} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Insulin type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)} className={fieldClass}>
            <option value="rapid">Rapid-acting</option>
            <option value="long">Long-acting</option>
            <option value="mixed">Mixed</option>
            <option value="other">Other / not specified</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Notes (optional)</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={300} placeholder="Meal, injection site, or anything useful to remember" className={`${fieldClass} resize-none`} />
        </label>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <div className="rounded-xl border border-gold/25 bg-gold/8 px-3 py-2.5 text-xs leading-5 text-muted">
          Record the dose you actually took. Change insulin only according to your prescriber’s instructions.
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={saving || !dose} className="rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-[#102024] disabled:opacity-50">{saving ? "Saving…" : entry ? "Save changes" : "Save entry"}</button>
        </div>
      </form>
    </Dialog>
  );
}
