import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton.jsx";
import FoodFormModal from "../components/FoodFormModal.jsx";
import { giClass, SLOTS } from "../food.js";
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
    .map((id) => SLOTS.find((slot) => slot.id === id)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="page-pad">
      <Link to="/health/food" className="text-sm text-coral hover:underline">
        Back to food styles
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
            My Health · Recipe
          </p>
          <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">{item.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {item.style}
            {times ? ` · ${times}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FavoriteButton on={Boolean(item.favorite)} onClick={handleFavorite} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:text-ink"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:text-coral"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Macro label="Carbs" value={`${item.carbsG}g`} />
        <Macro label="Fiber" value={`${item.fiberG}g`} />
        <Macro label="Protein" value={`${item.proteinG}g`} />
        <Macro label="Fat" value={`${item.fatG}g`} />
        <Macro
          label="GI"
          value={item.glycemicIndex}
          className={giClass[item.glycemicIndex]}
        />
      </div>

      <div className="mt-8 max-w-2xl rounded-2xl border border-line bg-[#222838]/80 p-5">
        <h3 className="text-lg font-semibold">How to make it</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink/90">
          {item.instructions || "No recipe steps yet."}
        </p>
      </div>

      <div className="mt-4 max-w-2xl rounded-2xl border border-line bg-[#222838]/80 p-5">
        <h3 className="text-lg font-semibold">Sugar note</h3>
        <p className="mt-3 text-sm leading-6 text-ink/90">
          {item.sugarNote || "No sugar note yet."}
        </p>
      </div>

      {editing ? (
        <FoodFormModal
          item={item}
          onClose={() => setEditing(false)}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}

function Macro({ label, value, className = "" }) {
  return (
    <div className="rounded-2xl border border-line bg-[#222838]/80 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-2 text-xl font-semibold capitalize ${className}`}>
        {value}
      </p>
    </div>
  );
}
