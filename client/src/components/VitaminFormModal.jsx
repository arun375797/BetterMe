import { useState } from "react";
import { Dialog } from "./Dialog.jsx";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-coral/50";

const TIMINGS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

const FOOD = [
  { id: "anytime", label: "Anytime" },
  { id: "before", label: "Before food" },
  { id: "after", label: "After food" },
  { id: "with", label: "With food" },
];

export default function VitaminFormModal({ item, onClose, onSubmit }) {
  const editing = Boolean(item);
  const [name, setName] = useState(item?.name || "");
  const [kind, setKind] = useState(item?.kind || "vitamin");
  const [dose, setDose] = useState(item?.dose || "");
  const [timings, setTimings] = useState(item?.timings || ["morning"]);
  const [foodTiming, setFoodTiming] = useState(item?.foodTiming || "anytime");
  const [notes, setNotes] = useState(item?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleTiming(id) {
    setTimings((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give this a name.");
      return;
    }
    if (!timings.length) {
      setError("Pick at least one time of day.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        kind,
        dose: dose.trim(),
        timings,
        foodTiming,
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
              My Health · Vitamin
            </p>
            <h3 className="mt-1 text-xl font-semibold">
              {editing ? "Edit item" : "Add vitamin or tablet"}
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
            <span className="mb-1.5 block text-xs text-muted">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vitamin D, Metformin"
              className={fieldClass}
              required
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs text-muted">Type</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "vitamin", label: "Vitamin" },
                { id: "tablet", label: "Tablet" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setKind(option.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${
                    kind === option.id
                      ? "border-coral/50 bg-coral/15 text-ink"
                      : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">
              Dose (optional)
            </span>
            <input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 1 tablet, 500 mg"
              className={fieldClass}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs text-muted">
              When you take it
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TIMINGS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleTiming(option.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${
                    timings.includes(option.id)
                      ? "border-coral/50 bg-coral/15 text-ink"
                      : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs text-muted">With meals</span>
            <div className="grid grid-cols-2 gap-2">
              {FOOD.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFoodTiming(option.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${
                    foodTiming === option.id
                      ? "border-teal/50 bg-teal/12 text-ink"
                      : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything else to remember"
              className={`${fieldClass} resize-y`}
            />
          </label>

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
              disabled={saving || !name.trim()}
              className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-[#2a1410] disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add to list"}
            </button>
          </div>
        </form>
    </Dialog>
  );
}
