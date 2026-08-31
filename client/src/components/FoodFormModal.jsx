import { useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { fieldClass, GI, SLOTS } from "../food.js";

export default function FoodFormModal({ item, defaultSlot, onClose, onSubmit }) {
  const editing = Boolean(item?._id);
  const [name, setName] = useState(item?.name || "");
  const [style, setStyle] = useState(item?.style || "");
  const [slots, setSlots] = useState(
    item?.slots?.length ? item.slots : [defaultSlot || "afternoon"]
  );
  const [instructions, setInstructions] = useState(item?.instructions || "");
  const [carbsG, setCarbsG] = useState(item?.carbsG ?? "");
  const [fiberG, setFiberG] = useState(item?.fiberG ?? "");
  const [proteinG, setProteinG] = useState(item?.proteinG ?? "");
  const [fatG, setFatG] = useState(item?.fatG ?? "");
  const [glycemicIndex, setGlycemicIndex] = useState(
    item?.glycemicIndex || "medium"
  );
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
        carbsG,
        fiberG,
        proteinG,
        fatG,
        glycemicIndex,
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
      <form onSubmit={handleSubmit} className="p-6">
        <p className="text-[11px] tracking-[0.18em] text-coral uppercase">
          My Health · Food
        </p>
        <h3 className="mt-1 text-xl font-semibold">
          {editing ? "Edit food" : "Add food"}
        </h3>
        <p className="mt-1 text-sm text-muted">
          Style, how to make it, and the details that move sugar.
        </p>

        <label className="mt-5 block text-xs text-muted">Name</label>
        <input
          className={`${fieldClass} mt-1`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="mt-4 block text-xs text-muted">Style</label>
        <input
          className={`${fieldClass} mt-1`}
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="South Indian plate, salad, grain bowl"
          required
        />

        <p className="mt-4 text-xs text-muted">Used at</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SLOTS.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => toggleSlot(slot.id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                slots.includes(slot.id)
                  ? "border-coral/50 bg-coral/15 text-ink"
                  : "border-line bg-[#171c2a] text-muted"
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs text-muted">How to make it</label>
        <textarea
          className={`${fieldClass} mt-1 min-h-24`}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Carbs", carbsG, setCarbsG],
            ["Fiber", fiberG, setFiberG],
            ["Protein", proteinG, setProteinG],
            ["Fat", fatG, setFatG],
          ].map(([label, value, setValue]) => (
            <div key={label}>
              <label className="block text-xs text-muted">{label} g</label>
              <input
                className={`${fieldClass} mt-1`}
                type="number"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted">Glycemic index</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {GI.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setGlycemicIndex(option.id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                glycemicIndex === option.id
                  ? "border-coral/50 bg-coral/15 text-ink"
                  : "border-line bg-[#171c2a] text-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs text-muted">Sugar note</label>
        <textarea
          className={`${fieldClass} mt-1 min-h-16`}
          value={sugarNote}
          onChange={(e) => setSugarNote(e.target.value)}
          placeholder="How this meal tends to affect blood sugar"
        />

        {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2 text-sm text-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-[#2a1410]"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
