import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import FoodFormModal from "../components/FoodFormModal.jsx";
import { SLOTS } from "../food.js";
import {
  deleteFoodItem,
  getFoodItem,
  updateFoodItem,
} from "../api.js";

export default function RecipePage() {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    try {
      const data = await getFoodItem(foodId);
      setItem(data);
      setError("");
    } catch (err) {
      setError(err.message);
      setItem(null);
    }
  }

  useEffect(() => {
    load();
  }, [foodId]);

  async function handleFavorite() {
    const updated = await updateFoodItem(foodId, { favorite: !item.favorite });
    setItem(updated);
  }

  async function handleSave(payload) {
    const updated = await updateFoodItem(foodId, payload);
    setItem(updated);
  }

  async function handleDelete() {
    await deleteFoodItem(foodId);
    navigate("/health/food");
  }

  if (error && !item) {
    return (
      <div className="page-pad">
        <Link to="/health/food" className="text-sm text-coral hover:underline">
          Back to food
        </Link>
        <p className="mt-4 text-sm text-coral">{error}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-pad text-sm text-muted">Loading recipe…</div>
    );
  }

  const times = (item.slots || [])
    .map((id) => SLOTS.find((slot) => slot.id === id))
    .filter(Boolean);

  return (
    <div className="page-pad max-w-4xl">
      <Link
        to="/health/food"
        className="text-xs font-medium tracking-wide text-muted uppercase hover:text-ink"
      >
        ← Food styles
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.2em] text-coral/90 uppercase">
            My Health · Recipe
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight break-words sm:text-[2rem]">
            {item.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.style ? (
              <span className="rounded-md bg-white/6 px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted uppercase">
                {item.style}
              </span>
            ) : null}
            {times.map((slot) => (
              <span
                key={slot.id}
                className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted"
              >
                {slot.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FavoriteButton on={Boolean(item.favorite)} onClick={handleFavorite} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:border-white/20 hover:text-ink"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:border-coral/40 hover:text-coral"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        <Macro label="Carbs" value={`${item.carbsG}g`} />
        <Macro label="Fiber" value={`${item.fiberG}g`} />
        <Macro label="Protein" value={`${item.proteinG}g`} />
        <Macro label="Fat" value={`${item.fatG}g`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-line bg-[#1c2230] p-5">
          <h3 className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
            Method
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/90">
            {item.instructions || "No recipe steps yet."}
          </p>
        </article>
        <div className="space-y-4">
          <article className="rounded-2xl border border-line bg-[#1c2230] p-5">
            <h3 className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
              Sugar note
            </h3>
            <p className="mt-3 text-sm leading-6 text-ink/90">
              {item.sugarNote || "No sugar note yet."}
            </p>
          </article>
          <article className="rounded-2xl border border-line bg-[#1c2230] p-5">
            <h3 className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
              Video
            </h3>
            {item.youtubeUrl ? (
              <a
                href={item.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-[#2a1410]"
              >
                Watch on YouTube
              </a>
            ) : (
              <p className="mt-3 text-sm text-muted">No video link yet.</p>
            )}
          </article>
        </div>
      </div>

      {editing ? (
        <FoodFormModal
          item={item}
          onClose={() => setEditing(false)}
          onSubmit={handleSave}
        />
      ) : null}
      {confirmDelete ? (
        <ConfirmDialog
          kicker="Food"
          title={`Delete “${item.name}”?`}
          message="This food style will be removed from your catalogue. Meal logs already saved stay as they are."
          confirmLabel="Delete"
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}

function Macro({ label, value }) {
  return (
    <div className="bg-[#1c2230] px-4 py-4">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
