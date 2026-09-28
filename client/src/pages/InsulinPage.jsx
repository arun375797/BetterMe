import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InsulinChart, { insulinDays } from "../components/InsulinChart.jsx";
import InsulinEntryModal from "../components/InsulinEntryModal.jsx";
import {
  createInsulinEntry,
  deleteInsulinEntry,
  getInsulinEntries,
  updateInsulinEntry,
  updateInsulinSettings,
} from "../api.js";

const FILTERS = [
  { id: "week", label: "7 days", days: 7 },
  { id: "month", label: "30 days", days: 30 },
  { id: "quarter", label: "3 months", days: 90 },
  { id: "all", label: "All", days: null },
];

const KIND_LABEL = {
  rapid: "Rapid-acting",
  long: "Long-acting",
  mixed: "Mixed",
  other: "Not specified",
};

function startDaysAgo(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

function sameLocalDay(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function average(values) {
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function formatWhen(value) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

export default function InsulinPage() {
  const [entries, setEntries] = useState([]);
  const [reference, setReference] = useState(35);
  const [referenceInput, setReferenceInput] = useState("35");
  const [filter, setFilter] = useState("month");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingReference, setSavingReference] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await getInsulinEntries();
      setEntries(data.entries || []);
      const nextReference = data.settings?.dailyReference ?? 35;
      setReference(nextReference);
      setReferenceInput(String(nextReference));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  const selectedFilter = FILTERS.find((item) => item.id === filter) || FILTERS[1];
  const filtered = useMemo(() => {
    if (!selectedFilter.days) return entries;
    const from = startDaysAgo(selectedFilter.days);
    return entries.filter((entry) => new Date(entry.recordedAt) >= from);
  }, [entries, selectedFilter.days]);
  const days = useMemo(() => insulinDays(filtered), [filtered]);
  const todayEntries = entries.filter((entry) => sameLocalDay(new Date(entry.recordedAt), new Date()));
  const todayTotal = todayEntries.reduce((sum, entry) => sum + Number(entry.dose || 0), 0);
  const weekEntries = entries.filter((entry) => new Date(entry.recordedAt) >= startDaysAgo(7));
  const weekDays = insulinDays(weekEntries);
  const monthEntries = entries.filter((entry) => new Date(entry.recordedAt) >= startDaysAgo(30));
  const monthDays = insulinDays(monthEntries);
  const directCount = filtered.filter((entry) => entry.source === "direct").length;
  const sugarCount = filtered.length - directCount;

  async function create(payload) {
    await createInsulinEntry(payload);
    await load();
  }

  async function update(payload) {
    if (!editing?._id) return;
    await updateInsulinEntry(editing._id, payload);
    await load();
  }

  async function remove(id) {
    if (!confirm("Remove this insulin entry?")) return;
    try {
      await deleteInsulinEntry(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveReference(event) {
    event.preventDefault();
    const value = Number(referenceInput);
    if (!Number.isFinite(value) || value < 0 || value > 200) {
      setError("Daily reference must be between 0 and 200 units.");
      return;
    }
    setSavingReference(true);
    try {
      const data = await updateInsulinSettings({ dailyReference: value });
      setReference(data.dailyReference);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingReference(false);
    }
  }

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="page-pad min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] tracking-[0.18em] text-cyan uppercase">My Health · Insulin</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Insulin history</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">See how much insulin you recorded each day and how the pattern changes across weeks and months. Doses entered with a sugar reading appear here automatically.</p>
          </div>
          <button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="rounded-xl bg-cyan px-4 py-2.5 text-sm font-semibold text-[#102024]">Record insulin</button>
        </div>

        <div className="mt-5 rounded-2xl border border-gold/25 bg-gold/8 px-4 py-3 text-sm leading-6 text-muted">
          <span className="font-semibold text-gold">Tracking only:</span> use this page to understand your records. Do not reduce or change insulin based on this chart alone—follow the plan agreed with your prescriber.
        </div>
        {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Today recorded" value={`${todayTotal || 0} u`} hint={`${todayEntries.length} ${todayEntries.length === 1 ? "entry" : "entries"}`} />
          <Stat label="7-day daily average" value={weekDays.length ? `${average(weekDays.map((day) => day.total))} u` : "—"} hint={`${weekDays.length} days with records`} />
          <Stat label="30-day daily average" value={monthDays.length ? `${average(monthDays.map((day) => day.total))} u` : "—"} hint={`${monthDays.length} days with records`} />
          <Stat label="Daily reference" value={`${reference} u`} hint="Set with your clinician" />
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-raised/80 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[12px] tracking-[0.18em] text-muted uppercase">Recorded pattern</p><h3 className="mt-1 text-lg font-semibold">Insulin by day</h3></div>
            <div className="flex flex-wrap gap-2">{FILTERS.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-full border px-3 py-1.5 text-xs ${filter === item.id ? "border-cyan/50 bg-cyan/15 text-ink" : "border-line bg-surface text-muted hover:bg-white/5"}`}>{item.label}</button>)}</div>
          </div>
          <InsulinChart entries={filtered} reference={reference} />
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[12px] tracking-[0.18em] text-muted uppercase">Combined log</p><h3 className="mt-1 text-lg font-semibold">All recorded doses</h3></div><p className="text-xs text-muted">{filtered.length} entries · {days.length} days</p></div>
          {filtered.length ? <ul data-lenis-prevent className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto overscroll-contain pr-1">{filtered.map((entry) => (
            <li key={entry._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-raised/80 px-4 py-3">
              <span className="w-16 shrink-0 text-xl font-semibold text-cyan">{entry.dose} u</span>
              <span className="min-w-[12rem] flex-1"><span className="block text-sm text-ink">{entry.source === "sugar" ? "Recorded with sugar" : KIND_LABEL[entry.kind] || KIND_LABEL.other}</span><span className="mt-0.5 block text-[11px] text-muted">{formatWhen(entry.recordedAt)}{entry.notes ? ` · ${entry.notes}` : ""}</span></span>
              <span className={`rounded-full px-2 py-1 text-[10px] font-medium ring-1 ${entry.source === "sugar" ? "bg-coral/10 text-coral ring-coral/25" : "bg-cyan/10 text-cyan ring-cyan/25"}`}>{entry.source === "sugar" ? "Sugar form" : "Direct"}</span>
              {entry.source === "direct" ? <><button type="button" onClick={() => { setEditing(entry); setOpen(true); }} className="text-xs text-muted hover:text-ink">Edit</button><button type="button" onClick={() => remove(entry._id)} className="text-xs text-muted hover:text-coral">Remove</button></> : <Link to="/health/sugar" className="text-xs text-muted hover:text-coral">Open Sugar</Link>}
            </li>
          ))}</ul> : <p className="mt-4 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">No insulin recorded in this period.</p>}
        </div>
      </section>

      <aside className="page-aside">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">Daily reference</p>
        <h3 className="mt-2 text-lg font-semibold">Your tracking guide</h3>
        <form onSubmit={saveReference} className="mt-5">
          <label className="block"><span className="mb-1.5 block text-xs text-muted">Clinician-set units per day</span><div className="flex gap-2"><input type="number" min="0" max="200" step="0.5" value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-cyan/50"/><button type="submit" disabled={savingReference} className="rounded-xl bg-cyan/15 px-3 py-2 text-xs font-medium text-cyan ring-1 ring-cyan/25 disabled:opacity-50">Save</button></div></label>
        </form>
        <div className="mt-7 space-y-4"><Row label="Entries in view" value={filtered.length} /><Row label="Days recorded" value={days.length} /><Row label="From Sugar" value={sugarCount} /><Row label="Added directly" value={directCount} /></div>
        <div className="mt-8 rounded-2xl border border-line bg-white/4 p-4 text-sm leading-6 text-muted">A lower recorded amount is not automatically safer or better. Review glucose readings, food, activity, illness, and hypoglycemia with your clinician before changing a dose.</div>
      </aside>

      {open ? <InsulinEntryModal entry={editing} onClose={() => { setOpen(false); setEditing(null); }} onSubmit={editing ? update : create} /> : null}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return <div className="rounded-2xl border border-line bg-raised/80 p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted">{hint}</p></div>;
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-muted">{label}</span><span>{value}</span></div>;
}
