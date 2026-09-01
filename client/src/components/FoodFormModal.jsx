import { useState } from "react";
import { Dialog, DialogFooter, DialogHeader } from "./Dialog.jsx";
import { fieldClass, SLOTS } from "../food.js";

export default function FoodFormModal({ item, defaultSlot, onClose, onSubmit }) {
  const editing = Boolean(item?._id);
  const [name, setName] = useState(item?.name || "");
  const [style, setStyle] = useState(item?.style || "");
  const [slots, setSlots] = useState(
    item?.slots?.length ? item.slots : [defaultSlot || "afternoon"]
  );
  const [instructions, setInstructions] = useState(item?.instructions || "");
  const [youtubeUrl, setYoutubeUrl] = useState(item?.youtubeUrl || "");
  const [carbsG, setCarbsG] = useState(item?.carbsG ?? "");
  const [fiberG, setFiberG] = useState(item?.fiberG ?? "");
  const [proteinG, setProteinG] = useState(item?.proteinG ?? "");
  const [fatG, setFatG] = useState(item?.fatG ?? "");
  const [sugarNote, setSugarNote] = useState(item?.sugarNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleSlot(id) {
    setSlots((current) =>
      current.includes(id)
        ? current.filter((slot) => slot !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name,
        style,
        slots,
        instructions,
        youtubeUrl,
        carbsG,
        fiberG,
        proteinG,
        fatG,
        sugarNote,
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
      <form onSubmit={handleSubmit}>
        <DialogHeader
          kicker="My Health · Food"
          title={editing ? "Edit food style" : "New food style"}
          onClose={onClose}
        />
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-6 text-muted">
            Name the plate, pick meal times, and keep macros for sugar tracking.
          </p>

          <Field label="Name">
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="Style">
            <input
              className={fieldClass}
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="South Indian, salad, grain bowl"
              required
            />
          </Field>

          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              Used at
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => toggleSlot(slot.id)}
                  className={`rounded-lg border px-2 py-2 text-left ${
                    slots.includes(slot.id)
                      ? "border-coral/50 bg-coral/12 text-ink"
                      : "border-line bg-[#171c2a] text-muted"
                  }`}
                >
                  <span className="block text-xs font-semibold">{slot.label}</span>
                  <span className="text-[10px] opacity-80">{slot.meal}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="How to make it">
            <textarea
              className={`${fieldClass} min-h-24`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </Field>

          <Field label="YouTube link">
            <input
              className={fieldClass}
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Optional"
            />
          </Field>

          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              Macros (g)
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Carbs", carbsG, setCarbsG],
                ["Fiber", fiberG, setFiberG],
                ["Protein", proteinG, setProteinG],
                ["Fat", fatG, setFatG],
              ].map(([label, value, setValue]) => (
                <label key={label} className="block">
                  <span className="text-[11px] text-muted">{label}</span>
                  <input
                    className={`${fieldClass} mt-1`}
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>

          <Field label="Sugar note">
            <textarea
              className={`${fieldClass} min-h-16`}
              value={sugarNote}
              onChange={(e) => setSugarNote(e.target.value)}
              placeholder="How this meal tends to affect blood sugar"
            />
          </Field>

          {error ? <p className="text-sm text-coral">{error}</p> : null}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-[#2a1410]"
          >
            {saving ? "Saving…" : "Save style"}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium tracking-wide text-muted uppercase">
        {label}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
