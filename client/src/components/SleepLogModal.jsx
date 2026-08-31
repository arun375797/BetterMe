import { useEffect, useMemo, useState } from "react";
import { Dialog } from "./Dialog.jsx";
import TimePicker12, { parse12 } from "./TimePicker12.jsx";
import { formatMinutes } from "../lib/sleepStats.js";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-coral/50";

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function computeDuration(bedDate, bedTime, wakeDate, wakeTime) {
  if (!bedDate || !bedTime || !wakeDate || !wakeTime) return null;
  const bed = new Date(`${bedDate}T${bedTime}`);
  let wake = new Date(`${wakeDate}T${wakeTime}`);
  if (Number.isNaN(bed.getTime()) || Number.isNaN(wake.getTime())) return null;
  if (wake <= bed) wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
  const minutes = Math.round((wake - bed) / 60000);
  if (minutes < 1 || minutes > 960) return null;
  return minutes;
}

function formatTime12(time24) {
  const p = parse12(time24);
  return `${p.hour}:${p.minute} ${p.ampm}`;
}

export default function SleepLogModal({ log, onClose, onSubmit }) {
  const editing = Boolean(log);
  const [wakeDate, setWakeDate] = useState(log?.wakeDate || log?.day || todayKey());
  const [bedDate, setBedDate] = useState(log?.bedDate || yesterdayKey());
  const [bedTime, setBedTime] = useState(log?.bedTime || "23:00");
  const [wakeTime, setWakeTime] = useState(log?.wakeTime || "07:00");
  const [quality, setQuality] = useState(
    log?.quality != null ? String(log.quality) : ""
  );
  const [notes, setNotes] = useState(log?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const duration = useMemo(
    () => computeDuration(bedDate, bedTime, wakeDate, wakeTime),
    [bedDate, bedTime, wakeDate, wakeTime]
  );

  useEffect(() => {
    if (editing) return;
    const bed = new Date(`${bedDate}T${bedTime}`);
    const wake = new Date(`${wakeDate}T${wakeTime}`);
    if (!Number.isNaN(bed.getTime()) && !Number.isNaN(wake.getTime()) && wake <= bed) {
      setBedDate(yesterdayKey());
    }
  }, [wakeDate, wakeTime, editing]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!wakeDate || !bedDate || !bedTime || !wakeTime) {
      setError("Fill in bed time, wake time, and dates.");
      return;
    }
    if (!duration) {
      setError("Sleep must be between 1 minute and 16 hours.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        wakeDate,
        bedDate,
        bedTime,
        wakeTime,
        quality: quality === "" ? null : Number(quality),
        notes: notes.trim(),
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
            My Health · Sleep
          </p>
          <h3 className="mt-1 text-xl font-semibold">
            {editing ? "Edit sleep" : "Log last night"}
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
        <div className="rounded-xl border border-line/70 bg-white/[0.03] p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            Went to bed
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Date</span>
              <input
                type="date"
                value={bedDate}
                onChange={(e) => setBedDate(e.target.value)}
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Time</span>
              <TimePicker12 value={bedTime} onChange={setBedTime} />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-line/70 bg-white/[0.03] p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            Woke up
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Date</span>
              <input
                type="date"
                value={wakeDate}
                onChange={(e) => setWakeDate(e.target.value)}
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Time</span>
              <TimePicker12 value={wakeTime} onChange={setWakeTime} />
            </label>
          </div>
        </div>

        {duration ? (
          <div className="rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-3">
            <p className="text-xs text-muted">Duration</p>
            <p className="mt-1 text-lg font-semibold text-cyan">
              {formatMinutes(duration)}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {formatTime12(bedTime)} on {bedDate} → {formatTime12(wakeTime)} on{" "}
              {wakeDate}
            </p>
          </div>
        ) : (
          <p className="text-xs text-coral">
            Pick valid bed and wake times (1 min – 16 hours apart).
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">
              How rested (1–10)
            </span>
            <input
              type="number"
              min="1"
              max="10"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              placeholder="optional"
              className={fieldClass}
            />
          </label>
          <label className="block col-span-2 sm:col-span-1">
            <span className="mb-1.5 block text-xs text-muted">Notes</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. woke once, late screen time"
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
            disabled={saving || !duration}
            className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-[#2a1410] disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Save sleep"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
