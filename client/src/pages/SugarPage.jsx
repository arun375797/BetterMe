import { useEffect, useMemo, useState } from "react";
import SugarRecordModal from "../components/SugarRecordModal.jsx";
import SugarChart from "../components/SugarChart.jsx";
import {
  createSugarReading,
  deleteSugarReading,
  getSugarReadings,
} from "../api.js";

const statusClass = {
  low: "text-cyan",
  "in range": "text-teal",
  elevated: "text-gold",
  high: "text-coral",
};

const levelNumberClass = {
  low: "text-cyan",
  "in range": "text-teal",
  elevated: "text-gold",
  high: "text-coral",
};

const FILTERS = [
  { id: "week", label: "Past 1 week" },
  { id: "month", label: "Past 1 month" },
  { id: "twoMonths", label: "Past 2 months" },
  { id: "high", label: "Exceeded high" },
];

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function avg(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function formatWhen(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function filterReadings(readings, filterId) {
  if (filterId === "week") {
    return readings.filter((item) => new Date(item.recordedAt) >= daysAgo(6));
  }
  if (filterId === "month") {
    return readings.filter((item) => new Date(item.recordedAt) >= daysAgo(29));
  }
  if (filterId === "high") {
    return readings.filter((item) => item.status === "high");
  }
  const from = daysAgo(59);
  return readings.filter((item) => new Date(item.recordedAt) >= from);
}

export default function SugarPage() {
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("twoMonths");

  async function load() {
    try {
      const data = await getSugarReadings();
      setReadings(data.readings || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(payload) {
    await createSugarReading(payload);
    await load();
  }

  async function handleDelete(id) {
    await deleteSugarReading(id);
    await load();
  }

  const filtered = useMemo(
    () => filterReadings(readings, filter),
    [readings, filter]
  );
  const sortedLog = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)
      ),
    [filtered]
  );
  const latest = readings[0];
  const levels = filtered.map((item) => item.level);
  const highCount = filtered.filter((item) => item.status === "high").length;
  const todayCount = readings.filter(
    (item) => new Date(item.recordedAt) >= daysAgo(0)
  ).length;
  const todayAverage = avg(
    readings
      .filter((item) => new Date(item.recordedAt) >= daysAgo(0))
      .map((item) => item.level)
  );
  const insulinTaken = filtered.filter((item) => Number(item.insulinDose) > 0);
  const insulinTotal = insulinTaken.reduce(
    (sum, item) => sum + Number(item.insulinDose || 0),
    0
  );
  const insulinAverage = avg(insulinTaken.map((item) => item.insulinDose));
  const filterLabel = FILTERS.find((item) => item.id === filter)?.label;

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
              My Health · Sugar
            </p>
            <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">Sugar levels</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Dummy readings fill the past two months so the chart has a
              history. Record sugar and insulin together in one popup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-[#2a1410]"
          >
            Record sugar level
          </button>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-coral">{error}</p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Latest"
            value={latest ? `${latest.level}` : "—"}
            hint={
              latest
                ? `${latest.mealTiming === "before" ? "Before" : "After"} food`
                : "No readings yet"
            }
          />
          <StatCard
            label="Today average"
            value={todayAverage ?? "—"}
            hint={`${todayCount} today`}
          />
          <StatCard
            label={`${filterLabel} avg`}
            value={avg(levels) ?? "—"}
            hint={`${filtered.length} readings`}
          />
          <StatCard
            label="High in this view"
            value={highCount}
            hint={
              levels.length
                ? `range ${Math.min(...levels)}–${Math.max(...levels)}`
                : "no points"
            }
          />
        </div>

        <div className="mt-6 min-w-0 rounded-2xl border border-line bg-[#222838]/80 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
                Control
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                How well sugar is holding
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    filter === item.id
                      ? "border-coral/50 bg-coral/15 text-ink"
                      : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" />
              In range
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              Elevated
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-coral" />
              High / mistake
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-ink bg-transparent" />
              Circle = before food
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rotate-45 bg-gold" />
              Diamond = after food
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-ink" />
              Daily average
            </span>
          </div>
          <div className="mt-4">
            <SugarChart readings={filtered} />
          </div>
        </div>

        <div className="mt-6 max-w-full sm:max-w-[380px]">
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-lg font-semibold">Log</h3>
            <p className="text-xs text-muted">
              {sortedLog.length} in {filterLabel?.toLowerCase()}
            </p>
          </div>
          {sortedLog.length ? (
            <ul className="mt-3 max-h-[480px] space-y-2 overflow-auto pr-1" data-lenis-prevent>
              {sortedLog.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-[#222838]/80 px-3 py-2.5"
                >
                  <span
                    className={`w-12 shrink-0 text-right text-[22px] leading-none font-semibold ${
                      levelNumberClass[item.status] || "text-ink"
                    }`}
                  >
                    {item.level}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] leading-tight">
                      <span>
                        {item.mealTiming === "before"
                          ? "Before food"
                          : "After food"}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-muted">
                      {formatWhen(item.recordedAt)}
                      {" · "}
                      {item.insulinDose
                        ? `insulin ${item.insulinDose} u`
                        : "no insulin"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[10px] capitalize ${
                      statusClass[item.status] || "text-muted"
                    }`}
                  >
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="shrink-0 text-[11px] text-muted hover:text-coral"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">
              No readings in this filter.
            </p>
          )}
        </div>
      </section>

      <aside className="page-aside">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          Snapshot
        </p>
        <h3 className="mt-2 text-lg font-semibold">{filterLabel}</h3>
        <div className="mt-6 space-y-5">
          <Row label="Readings" value={filtered.length} />
          <Row label="Average" value={avg(levels) ?? "—"} teal />
          <Row
            label="Before food"
            value={
              avg(
                filtered
                  .filter((item) => item.mealTiming === "before")
                  .map((item) => item.level)
              ) ?? "—"
            }
          />
          <Row
            label="After food"
            value={
              avg(
                filtered
                  .filter((item) => item.mealTiming === "after")
                  .map((item) => item.level)
              ) ?? "—"
            }
          />
          <Row label="High readings" value={highCount} />
          <Row label="Insulin doses" value={insulinTaken.length} />
          <Row
            label="Insulin total"
            value={insulinTotal ? `${insulinTotal} u` : "—"}
            teal
          />
          <Row
            label="Avg dose"
            value={insulinAverage != null ? `${insulinAverage} u` : "—"}
          />
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-white/4 p-4 text-sm text-muted">
          Stay in the green band. After-food highs usually mean the meal or
          insulin timing slipped. Before-food highs usually mean overnight
          control slipped.
        </div>
      </aside>

      {open ? (
        <SugarRecordModal
          onClose={() => setOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
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

function Row({ label, value, teal }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={teal ? "text-teal" : ""}>{value}</span>
    </div>
  );
}
