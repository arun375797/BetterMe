import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton.jsx";
import FoodFormModal from "../components/FoodFormModal.jsx";
import MealLogModal from "../components/MealLogModal.jsx";
import FoodAdherenceChart, {
  buildDayRows,
} from "../components/FoodAdherenceChart.jsx";
import { giClass, SLOTS, todayKey } from "../food.js";
import {
  createFoodItem,
  getFoodItems,
  getMealLogs,
  updateFoodItem,
  upsertMealLog,
} from "../api.js";

const VIEWS = [
  { id: "today", label: "Today" },
  { id: "styles", label: "Food styles" },
];

export default function FoodPage() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [view, setView] = useState("today");
  const [foodModal, setFoodModal] = useState(null);
  const [logSlot, setLogSlot] = useState(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

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

  const today = todayKey();
  const todayBySlot = useMemo(() => {
    const map = {};
    for (const log of logs) {
      if (log.day === today) map[log.slot] = log;
    }
    return map;
  }, [logs, today]);

  const grouped = useMemo(() => {
    const list = onlyFavorites
      ? items.filter((item) => item.favorite)
      : items;
    return SLOTS.map((slot) => ({
      ...slot,
      foods: list.filter((item) => item.slots?.includes(slot.id)),
    }));
  }, [items, onlyFavorites]);

  const rows = buildDayRows(logs, 30);
  const completeDays = rows.filter((row) => row.complete).length;
  const todayEaten = SLOTS.filter(
    (slot) => todayBySlot[slot.id]?.status === "eaten"
  ).length;
  const todayMissed = 4 - todayEaten;

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
              My Health · Food
            </p>
            <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">Food</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Log today’s four meals here. Food styles shows recipe names and
              carbs. Open a recipe for the full method.
            </p>
          </div>
          {view === "styles" ? (
            <button
              type="button"
              onClick={() => setFoodModal({ item: null })}
              className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-[#2a1410]"
            >
              Add food
            </button>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                view === item.id
                  ? "border-coral/50 bg-coral/15 text-ink"
                  : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {view === "today" ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SLOTS.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  log={todayBySlot[slot.id]}
                  onLog={() => setLogSlot(slot.id)}
                />
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-[#222838]/80 p-5">
              <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
                Last 30 days
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                Eaten vs missed
              </h3>
              <div className="mt-4">
                <FoodAdherenceChart logs={logs} dayCount={30} />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOnlyFavorites(false)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  !onlyFavorites
                    ? "border-coral/50 bg-coral/15 text-ink"
                    : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setOnlyFavorites(true)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  onlyFavorites
                    ? "border-gold/50 bg-gold/15 text-ink"
                    : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                }`}
              >
                Favourites
              </button>
            </div>
            {grouped.map((group) => (
              <section key={group.id}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{group.label}</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFoodModal({ item: null, defaultSlot: group.id })
                    }
                    className="text-xs text-muted hover:text-ink"
                  >
                    Add here
                  </button>
                </div>
                {group.foods.length ? (
                  <ul className="mt-3 space-y-2">
                    {group.foods.map((item) => (
                      <li key={`${group.id}-${item._id}`}>
                        <StyleCard
                          item={item}
                          onFavorite={() => handleFavorite(item)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    {onlyFavorites
                      ? `No favourites for ${group.label.toLowerCase()}.`
                      : `No foods for ${group.label.toLowerCase()} yet.`}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </section>

      <aside className="page-aside">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          Snapshot
        </p>
        <h3 className="mt-2 text-lg font-semibold">Today</h3>
        <div className="mt-6 space-y-5 text-sm">
          <Row label="Eaten" value={`${todayEaten} / 4`} teal />
          <Row label="Missed" value={todayMissed} />
          <Row label="Complete days" value={completeDays} />
          <Row label="Saved foods" value={items.length} />
          <Row
            label="Favourites"
            value={items.filter((item) => item.favorite).length}
          />
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-white/4 p-4 text-sm text-muted">
          Today is for logging meals. Food styles lists the recipe name and
          macros. Open a recipe for steps and the sugar note.
        </div>
      </aside>

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
    </div>
  );
}

function SlotCard({ slot, log, onLog }) {
  const eaten = log?.status === "eaten";
  const skipped = log?.status === "skipped";
  return (
    <button
      type="button"
      onClick={onLog}
      className="rounded-2xl border border-line bg-[#222838]/80 p-4 text-left hover:border-coral/40"
    >
      <p className="text-xs text-muted">{slot.label}</p>
      <p
        className={`mt-2 text-sm font-semibold ${
          eaten ? "text-teal" : skipped ? "text-coral" : "text-muted"
        }`}
      >
        {eaten
          ? log.foodName || "Eaten"
          : skipped
            ? "Did not eat"
            : "Tap to log"}
      </p>
      <p className="mt-1 text-[11px] text-muted">
        {eaten
          ? `${log.carbsG || 0}g carbs · ${log.glycemicIndex || "medium"} GI`
          : "Eaten or skipped"}
      </p>
    </button>
  );
}

function StyleCard({ item, onFavorite }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-[#222838]/80 px-4 py-3">
      <Link
        to={`/health/food/${item._id}`}
        className="min-w-0 flex-1 hover:text-ink"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{item.name}</span>
          <span
            className={`text-[10px] uppercase ${giClass[item.glycemicIndex]}`}
          >
            {item.glycemicIndex} GI
          </span>
        </span>
        <span className="mt-1 block text-xs text-muted">
          {item.carbsG}g carbs · {item.fiberG}g fiber · {item.proteinG}g protein
          · {item.fatG}g fat
        </span>
      </Link>
      <FavoriteButton on={Boolean(item.favorite)} onClick={onFavorite} />
    </div>
  );
}

function Row({ label, value, teal }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={teal ? "text-teal" : ""}>{value}</span>
    </div>
  );
}
