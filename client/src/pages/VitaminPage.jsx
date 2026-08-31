import { useEffect, useMemo, useState } from "react";
import VitaminFormModal from "../components/VitaminFormModal.jsx";
import {
  createVitaminItem,
  deleteVitaminItem,
  getVitaminItems,
  updateVitaminItem,
} from "../api.js";

const TIMING_ORDER = ["morning", "afternoon", "evening", "night"];
const TIMING_LABEL = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};
const FOOD_LABEL = {
  anytime: "Anytime",
  before: "Before food",
  after: "After food",
  with: "With food",
};

export default function VitaminPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("all");

  async function load() {
    try {
      const data = await getVitaminItems();
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(payload) {
    if (modal?.item?._id) {
      await updateVitaminItem(modal.item._id, payload);
    } else {
      await createVitaminItem(payload);
    }
    await load();
  }

  async function handleDelete(id) {
    await deleteVitaminItem(id);
    await load();
  }

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.kind === filter);
  }, [items, filter]);

  const byTiming = useMemo(() => {
    return TIMING_ORDER.map((timing) => ({
      timing,
      items: visible.filter((item) => item.timings?.includes(timing)),
    }));
  }, [visible]);

  const vitaminCount = items.filter((item) => item.kind === "vitamin").length;
  const tabletCount = items.filter((item) => item.kind === "tablet").length;

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
              My Health · Vitamin
            </p>
            <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">Vitamins and tablets</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Keep a list of what you take, the dose, and the time of day. Add,
              edit, or remove items anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ item: null })}
            className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-[#2a1410]"
          >
            Add vitamin or tablet
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="On the list" value={items.length} hint="saved items" />
          <StatCard label="Vitamins" value={vitaminCount} hint="supplements" />
          <StatCard label="Tablets" value={tabletCount} hint="medicines" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: "all", label: "All" },
            { id: "vitamin", label: "Vitamins" },
            { id: "tablet", label: "Tablets" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                filter === option.id
                  ? "border-coral/50 bg-coral/15 text-ink"
                  : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {visible.length ? (
          <div className="mt-8 space-y-8">
            {byTiming.map((group) =>
              group.items.length ? (
                <div key={group.timing}>
                  <h3 className="text-lg font-semibold">
                    {TIMING_LABEL[group.timing]}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <ItemCard
                        key={`${group.timing}-${item._id}`}
                        item={item}
                        onEdit={() => setModal({ item })}
                        onDelete={() => handleDelete(item._id)}
                      />
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            {items.length
              ? "Nothing in this filter."
              : "Nothing on this list yet. Add the vitamins and tablets you take so they stay here."}
          </p>
        )}
      </section>

      <aside className="page-aside">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          By time of day
        </p>
        <h3 className="mt-2 text-lg font-semibold">Schedule</h3>
        <div className="mt-6 space-y-5">
          {TIMING_ORDER.map((timing) => (
            <Row
              key={timing}
              label={TIMING_LABEL[timing]}
              value={
                items.filter((item) => item.timings?.includes(timing)).length
              }
            />
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-white/4 p-4 text-sm text-muted">
          This is a reminder list, not a dose log. Insulin stays in sugar
          tracking.
        </div>
      </aside>

      {modal ? (
        <VitaminFormModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}

function ItemCard({ item, onEdit, onDelete }) {
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-2xl border border-line bg-[#222838]/80 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{item.name}</span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            {item.kind}
          </span>
        </span>
        <span className="mt-1 block text-xs text-muted">
          {[
            item.dose || null,
            FOOD_LABEL[item.foodTiming],
            item.timings?.map((t) => TIMING_LABEL[t]).join(", "),
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {item.notes ? (
          <span className="mt-1 block text-sm text-ink/80">{item.notes}</span>
        ) : null}
      </span>
      <div className="flex gap-2">
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
      </div>
    </li>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-[#222838]/80 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
