import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import FoodFormModal from "../components/FoodFormModal.jsx";
import MealLogModal from "../components/MealLogModal.jsx";
import FoodAdherenceChart, {
  buildDayRows,
} from "../components/FoodAdherenceChart.jsx";
import { SLOTS, fieldClass, todayKey } from "../food.js";
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItems,
  getMealLogs,
  peek,
  updateFoodItem,
  upsertMealLog,
} from "../api.js";

export default function FoodPage() {
  const [items, setItems] = useState(
    () => peek("/api/food", "/items")?.items || []
  );
  const [logs, setLogs] = useState(() => peek("/api/food", "/logs")?.logs || []);
  const [error, setError] = useState("");
  const [view, setView] = useState("styles");
  const [foodModal, setFoodModal] = useState(null);
  const [logSlot, setLogSlot] = useState(null);
  const [slotFilter, setSlotFilter] = useState("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  async function load() {
    try {
      const [foodData, logData] = await Promise.all([
        getFoodItems(),
        getMealLogs(),
      ]);
      setItems(foodData.items || []);
      setLogs(logData.logs || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSaveFood(payload) {
    if (foodModal?.item?._id) {
      await updateFoodItem(foodModal.item._id, payload);
    } else {
      await createFoodItem(payload);
    }
    await load();
  }

  async function handleFavorite(item) {
    await updateFoodItem(item._id, { favorite: !item.favorite });
    await load();
  }

  async function handleSaveLog(payload) {
    await upsertMealLog(payload);
    await load();
  }

  async function handleDeleteFood() {
    if (!pendingDelete?._id) return;
    await deleteFoodItem(pendingDelete._id);
    setPendingDelete(null);
    await load();
  }

  const today = todayKey();
  const todayBySlot = useMemo(() => {
    const map = {};
    for (const log of logs) {
      if (log.day === today) map[log.slot] = log;
    }
    return map;
  }, [logs, today]);

  const catalogue = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (onlyFavorites && !item.favorite) return false;
      if (slotFilter !== "all" && !item.slots?.includes(slotFilter)) {
        return false;
      }
      if (!q) return true;
      const times = (item.slots || [])
        .map((id) => {
          const slot = SLOTS.find((s) => s.id === id);
          return `${slot?.label || ""} ${slot?.meal || ""}`;
        })
        .join(" ");
      const hay = [
        item.name,
        item.style,
        item.instructions,
        item.sugarNote,
        times,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, onlyFavorites, slotFilter, query]);

  const rows = buildDayRows(logs, 30);
  const completeDays = rows.filter((row) => row.complete).length;
  const todayEaten = SLOTS.filter(
    (slot) => todayBySlot[slot.id]?.status === "eaten"
  ).length;
  const favorites = items.filter((item) => item.favorite).length;

  return (
    <div className="page-pad">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
            My Health · Food
          </p>
          <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">
            Food
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Four meals a day, plus the styles you cook. Open a style for the
            full method.
          </p>
        </div>
        {view === "styles" ? (
          <button
            type="button"
            onClick={() =>
              setFoodModal({
                item: null,
                defaultSlot: slotFilter === "all" ? "afternoon" : slotFilter,
              })
            }
            className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-[#2a1410]"
          >
            Add food style
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setLogSlot(
                SLOTS.find((slot) => !todayBySlot[slot.id])?.id || "morning"
              )
            }
            className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-[#2a1410]"
          >
            Log a meal
          </button>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={`${todayEaten} / 4`}
          hint="meals logged"
        />
        <StatCard
          label="Styles"
          value={items.length}
          hint="in your catalogue"
        />
        <StatCard label="Favourites" value={favorites} hint="starred plates" />
        <StatCard
          label="Complete days"
          value={completeDays}
          hint="last 30 days"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Tab
          active={view === "today"}
          onClick={() => setView("today")}
          label="Today"
        />
        <Tab
          active={view === "styles"}
          onClick={() => setView("styles")}
          label="Food styles"
        />
      </div>

      {view === "today" ? (
        <>
          <div id="jump-meals" data-jump="Meals" className="mt-6 grid gap-3 sm:grid-cols-2">
            {SLOTS.map((slot) => (
              <MealCard
                key={slot.id}
                slot={slot}
                log={todayBySlot[slot.id]}
                onLog={() => setLogSlot(slot.id)}
              />
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-[#222838]/80 p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
                  Last 30 days
                </p>
                <h3 className="mt-1 text-lg font-semibold">Eaten vs missed</h3>
              </div>
            </div>
            <div className="mt-4">
              <FoodAdherenceChart logs={logs} dayCount={30} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div id="jump-styles" data-jump="Styles" className="mt-6 flex flex-wrap gap-2">
            <Chip
              active={slotFilter === "all" && !onlyFavorites}
              onClick={() => {
                setSlotFilter("all");
                setOnlyFavorites(false);
              }}
              label="All"
            />
            {SLOTS.map((slot) => (
              <Chip
                key={slot.id}
                active={slotFilter === slot.id && !onlyFavorites}
                onClick={() => {
                  setSlotFilter(slot.id);
                  setOnlyFavorites(false);
                }}
                label={slot.meal}
              />
            ))}
            <Chip
              active={onlyFavorites}
              onClick={() => {
                setOnlyFavorites(true);
                setSlotFilter("all");
              }}
              label="Favourites"
              gold
            />
          </div>

          <div className="mt-4">
            <label className="sr-only" htmlFor="food-style-search">
              Search food styles
            </label>
            <input
              id="food-style-search"
              type="search"
              className={fieldClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, cuisine, or ingredient…"
              autoComplete="off"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-[#222838]/80">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1fr)_auto] gap-4 border-b border-line px-4 py-2.5 text-[11px] tracking-wide text-muted uppercase sm:grid">
              <span>Style</span>
              <span>Cuisine</span>
              <span>Macros</span>
              <span className="text-right"> </span>
            </div>
            {catalogue.length ? (
              <ul>
                {catalogue.map((item, index) => (
                  <li
                    key={item._id}
                    className={
                      index < catalogue.length - 1 ? "border-b border-line/80" : ""
                    }
                  >
                    <StyleRow
                      item={item}
                      onFavorite={() => handleFavorite(item)}
                      onEdit={() => setFoodModal({ item })}
                      onDelete={() => setPendingDelete(item)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-14 text-center">
                <p className="text-sm font-medium">No food styles here</p>
                <p className="mt-1 text-sm text-muted">
                  {query.trim()
                    ? `Nothing matches “${query.trim()}”.`
                    : onlyFavorites
                      ? "Star a plate from the catalogue to see it in favourites."
                      : "Add the meals you cook so they show up when you log today."}
                </p>
                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-4 text-sm font-semibold text-coral hover:underline"
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFoodModal({
                        item: null,
                        defaultSlot:
                          slotFilter === "all" ? "afternoon" : slotFilter,
                      })
                    }
                    className="mt-4 text-sm font-semibold text-coral hover:underline"
                  >
                    Add food style
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {foodModal ? (
        <FoodFormModal
          item={foodModal.item}
          defaultSlot={foodModal.defaultSlot}
          onClose={() => setFoodModal(null)}
          onSubmit={handleSaveFood}
        />
      ) : null}
      {logSlot ? (
        <MealLogModal
          slotId={logSlot}
          foods={items}
          existing={todayBySlot[logSlot]}
          onClose={() => setLogSlot(null)}
          onSubmit={handleSaveLog}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          kicker="Food"
          title={`Delete “${pendingDelete.name}”?`}
          message="This food style will be removed from your catalogue. Meal logs already saved stay as they are."
          confirmLabel="Delete"
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDeleteFood}
        />
      ) : null}
    </div>
  );
}

function Tab({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs ${
        active
          ? "border-coral/50 bg-coral/15 text-ink"
          : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function Chip({ active, onClick, label, gold }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs ${
        active
          ? gold
            ? "border-gold/50 bg-gold/15 text-ink"
            : "border-coral/50 bg-coral/15 text-ink"
          : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-[#222838]/80 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function MealCard({ slot, log, onLog }) {
  const eaten = log?.status === "eaten";
  const skipped = log?.status === "skipped";

  return (
    <button
      type="button"
      onClick={onLog}
      className="rounded-2xl border border-line bg-[#222838]/80 p-4 text-left hover:border-coral/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{slot.meal}</p>
          <p className="mt-0.5 text-xs text-muted">
            {slot.label} · {slot.typical}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
            eaten
              ? "bg-teal/12 text-teal"
              : skipped
                ? "bg-coral/12 text-coral"
                : "bg-white/6 text-muted"
          }`}
        >
          {eaten ? "Eaten" : skipped ? "Skipped" : "Open"}
        </span>
      </div>
      <p
        className={`mt-4 text-sm ${
          eaten ? "font-medium text-ink" : skipped ? "text-coral" : "text-muted"
        }`}
      >
        {eaten
          ? log.foodName || "Eaten"
          : skipped
            ? "Did not eat"
            : "Tap to log"}
      </p>
      <p className="mt-1 text-xs text-muted">
        {eaten ? `${log.carbsG || 0} g carbs` : "Eaten or skipped"}
      </p>
    </button>
  );
}

function StyleRow({ item, onFavorite, onEdit, onDelete }) {
  const times = (item.slots || [])
    .map((id) => SLOTS.find((slot) => slot.id === id)?.meal)
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1fr)_auto] sm:gap-4">
      <Link to={`/health/food/${item._id}`} className="min-w-0 hover:text-ink">
        <span className="block truncate font-semibold">{item.name}</span>
        <span className="mt-0.5 block text-xs text-muted sm:hidden">
          {item.style}
          {item.style && times ? " · " : ""}
          {times}
        </span>
        <span className="mt-0.5 hidden text-xs text-muted sm:block">{times}</span>
      </Link>
      <p className="hidden truncate text-sm capitalize text-muted sm:block">
        {item.style || "—"}
      </p>
      <p className="text-xs tabular-nums text-muted">
        {item.carbsG || 0}c · {item.fiberG || 0}f · {item.proteinG || 0}p ·{" "}
        {item.fatG || 0}fat
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-muted hover:text-ink"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-muted hover:text-coral"
        >
          Delete
        </button>
        <FavoriteButton
          compact
          on={Boolean(item.favorite)}
          onClick={onFavorite}
        />
      </div>
    </div>
  );
}
