import { useMemo, useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { fieldClass, SLOTS, todayKey } from "../food.js";

export default function MealLogModal({
  slotId,
  foods,
  existing,
  onClose,
  onSubmit,
}) {
  const slot = SLOTS.find((item) => item.id === slotId) || SLOTS[0];
  const options = useMemo(
    () => foods.filter((item) => item.slots?.includes(slot.id)),
    [foods, slot.id]
  );

  const [day, setDay] = useState(existing?.day || todayKey());
  const [status, setStatus] = useState(existing?.status || "eaten");
  const [foodName, setFoodName] = useState(existing?.foodName || "");
  const [carbsG, setCarbsG] = useState(existing?.carbsG ?? "");
  const [fiberG, setFiberG] = useState(existing?.fiberG ?? "");
  const [proteinG, setProteinG] = useState(existing?.proteinG ?? "");
  const [fatG, setFatG] = useState(existing?.fatG ?? "");
  const [glycemicIndex, setGlycemicIndex] = useState(
    existing?.glycemicIndex || "medium"
  );
  const [sugarNote, setSugarNote] = useState(existing?.sugarNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function applyFood(food) {
    if (!food) return;
    setFoodName(food.name);
    setCarbsG(food.carbsG);
    setFiberG(food.fiberG);
    setProteinG(food.proteinG);
    setFatG(food.fatG);
    setGlycemicIndex(food.glycemicIndex);
    setSugarNote(food.sugarNote);
    setStatus("eaten");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        day,
        slot: slot.id,
        status,
        foodName,
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
        <h3 className="mt-1 text-xl font-semibold">Log {slot.label}</h3>
        <p className="mt-1 text-sm text-muted">
          Mark eaten or skipped, and keep the sugar details.
        </p>

        <label className="mt-5 block text-xs text-muted">Date</label>
        <input
          type="date"
          className={`${fieldClass} mt-1`}
          value={day}
          onChange={(e) => setDay(e.target.value)}
          required
        />

        <div className="mt-4 flex gap-2">
          {["eaten", "skipped"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                status === value
                  ? value === "eaten"
                    ? "border-teal/50 bg-teal/15 text-ink"
                    : "border-coral/50 bg-coral/15 text-ink"
                  : "border-line text-muted"
              }`}
            >
              {value === "eaten" ? "Eaten" : "Did not eat"}
            </button>
          ))}
        </div>

        {status === "skipped" ? (
          <p className="mt-4 text-sm text-muted">
            This meal will show as missed on the chart.
          </p>
        ) : (
          <>
            <label className="mt-4 block text-xs text-muted">
              Choose a saved food
            </label>
            <select
              className={`${fieldClass} mt-1`}
              value=""
              onChange={(e) => {
                applyFood(options.find((item) => item._id === e.target.value));
              }}
            >
              <option value="">Select…</option>
              {options.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-xs text-muted">What you ate</label>
            <input
              className={`${fieldClass} mt-1`}
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="Food name"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Carbs", carbsG, setCarbsG],
                ["Fiber", fiberG, setFiberG],
                ["Protein", proteinG, setProteinG],
                ["Fat", fatG, setFatG],
              ].map(([label, value, setValue]) => (
                <div key={label}>
                  <label className="text-[11px] text-muted">{label} g</label>
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

            <label className="mt-3 block text-xs text-muted">Sugar note</label>
            <input
              className={`${fieldClass} mt-1`}
              value={sugarNote}
              onChange={(e) => setSugarNote(e.target.value)}
            />
          </>
        )}

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
            {saving ? "Saving…" : "Save meal"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
