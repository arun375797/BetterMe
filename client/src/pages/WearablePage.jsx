import { useEffect, useMemo, useState } from "react";
import { getWearableData, peekWearableData } from "../api.js";

const number = new Intl.NumberFormat();
const STEP_GOAL = 10000;

function valueOrDash(value, suffix = "") {
  return value == null ? "—" : `${number.format(Math.round(value))}${suffix}`;
}

function km(value) {
  return value == null ? "—" : `${(value / 1000).toFixed(2)} km`;
}

function dayLabel(day) {
  if (!day) return "No sync yet";
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function historyDayLabel(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function localDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fillDays(records, count = 40) {
  const byDay = new Map(records.map((record) => [record.day, record]));
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const day = localDay(date);
    return byDay.get(day) || { day, dataAvailable: false };
  });
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    steps: <><path d="M8.5 3.5c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7Z" /><path d="M5.2 9.7c2-.9 4.3.1 5.2 2.1l1 2.4c.5 1.1-.1 2.4-1.2 2.8l-2.1.8a2 2 0 0 1-2.6-1.2l-1.6-4.2a2.2 2.2 0 0 1 1.3-2.7Z" /><path d="M16.3 11.8c1 0 1.8 1 1.8 2.3s-.8 2.3-1.8 2.3-1.8-1-1.8-2.3.8-2.3 1.8-2.3Z" /><path d="M14 17.1c1.7-.8 3.7.1 4.5 1.8l.5 1.1" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h3.5a2.5 2.5 0 0 0 0-5h-1a2.5 2.5 0 0 1 0-5H16" /></>,
    pulse: <><path d="M3 12h4l2.2-5 4.1 10 2.2-5H21" /></>,
    spark: <><path d="m12 3-1.4 4.2a5 5 0 0 1-3.2 3.2L3 12l4.4 1.6a5 5 0 0 1 3.2 3.2L12 21l1.4-4.2a5 5 0 0 1 3.2-3.2L21 12l-4.4-1.6a5 5 0 0 1-3.2-3.2L12 3Z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  };
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function WearablePage() {
  const cached = peekWearableData(40);
  const [syncedRecords, setSyncedRecords] = useState(() => cached?.records || []);
  const [error, setError] = useState("");

  useEffect(() => {
    getWearableData(40)
      .then((data) => {
        setSyncedRecords(data.records || []);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, []);

  const records = useMemo(() => fillDays(syncedRecords, 40), [syncedRecords]);
  const today = records[0];
  const latest = syncedRecords[0];
  const stepMax = useMemo(
    () => Math.max(STEP_GOAL, ...syncedRecords.map((item) => item.steps || 0)),
    [syncedRecords]
  );
  const goalProgress = Math.min(100, Math.round(((today.steps || 0) / STEP_GOAL) * 100));
  const remaining = Math.max(0, STEP_GOAL - (today.steps || 0));
  const recentWeek = records.slice(0, 7).filter((record) => record.steps != null);
  const weeklyAverage = recentWeek.length
    ? Math.round(recentWeek.reduce((sum, record) => sum + record.steps, 0) / recentWeek.length)
    : null;
  const goalDays = records.filter((record) => (record.steps || 0) >= STEP_GOAL).length;
  const bestDay = records.reduce(
    (best, record) => ((record.steps || 0) > (best?.steps || 0) ? record : best),
    null
  );

  return (
    <div className="page-pad mx-auto w-full max-w-[1540px]">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal shadow-[0_0_12px_var(--color-teal)]" />
            My health · movement
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Daily activity</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Steps and heart-rate insights synced from your Galaxy Fit3 through Health Connect.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line/80 bg-raised/70 px-4 py-2 text-xs text-muted shadow-sm">
          <span className="h-2 w-2 rounded-full bg-teal" />
          {dayLabel(latest?.day)}
        </div>
      </header>

      {error ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          <Icon name="info" className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : null}

      {!latest ? (
        <EmptyState />
      ) : (
        <>
          <section className="relative mt-7 overflow-hidden rounded-[28px] border border-teal/20 bg-raised/70 shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan/5 blur-3xl" />
            <div className="relative grid lg:grid-cols-[1.35fr_0.65fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-teal/20 bg-teal/10 text-teal">
                    <Icon name="steps" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Today’s steps</p>
                    <p className="mt-0.5 text-xs text-muted">{today.day}</p>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-2">
                  <strong className="text-5xl font-semibold leading-none tracking-[-0.05em] text-ink sm:text-7xl">
                    {valueOrDash(today.steps)}
                  </strong>
                  <span className="pb-1 text-sm text-muted sm:pb-2">of {number.format(STEP_GOAL)}</span>
                </div>

                <div className="mt-7 max-w-3xl">
                  <div className="h-3 overflow-hidden rounded-full bg-inset shadow-inner">
                    <div
                      className="h-full min-w-[4px] rounded-full bg-gradient-to-r from-cyan to-teal shadow-[0_0_18px_color-mix(in_oklab,var(--color-teal)_45%,transparent)] transition-[width] duration-700"
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                    <span className="font-medium text-teal">{goalProgress}% complete</span>
                    <span className="text-muted">
                      {remaining ? `${number.format(remaining)} steps to goal` : "Daily goal reached"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center border-t border-line/70 bg-inset/25 p-7 lg:border-l lg:border-t-0">
                <div className="relative grid aspect-square w-48 place-items-center rounded-full bg-inset p-3 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:w-52">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `conic-gradient(var(--color-teal) ${goalProgress * 3.6}deg, color-mix(in oklab, var(--ui-line) 65%, transparent) 0deg)` }}
                  />
                  <div className="relative grid h-full w-full place-items-center rounded-full border border-white/5 bg-raised">
                    <div className="text-center">
                      <Icon name="steps" className="mx-auto h-7 w-7 text-teal" />
                      <p className="mt-2 text-3xl font-semibold tracking-tight">{goalProgress}%</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-muted">Daily goal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon="heart" label="Current heart rate" value={valueOrDash(today.heartRate?.latest, " bpm")} hint={today.heartRate?.average ? `Daily average ${today.heartRate.average} bpm` : "No reading today"} tone="coral" />
            <MetricCard icon="pulse" label="Resting heart rate" value={valueOrDash(today.heartRate?.resting, " bpm")} hint="From Samsung Health" tone="cyan" />
            <MetricCard icon="route" label="Walking distance" value={km(today.distanceMeters)} hint="Distance covered today" tone="teal" />
            <MetricCard icon="spark" label="7-day average" value={valueOrDash(weeklyAverage)} hint={recentWeek.length ? `Across ${recentWeek.length} synced days` : "Waiting for activity data"} tone="gold" />
          </section>

          <section className="mt-8 grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
            <div className="overflow-hidden rounded-[24px] border border-line bg-raised/65 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold">Activity history</h2>
                  <p className="mt-1 text-xs text-muted">Your last 40 days, newest first</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-inset px-3 py-1.5 text-[11px] text-muted">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                  {number.format(STEP_GOAL)} step goal
                </div>
              </div>

              <div className="max-h-[580px] overflow-y-auto px-5 py-3 sm:px-6">
                {records.map((record, index) => {
                  const progress = record.steps == null ? 0 : Math.min(100, (record.steps / stepMax) * 100);
                  const hitGoal = (record.steps || 0) >= STEP_GOAL;
                  return (
                    <div key={record.day} className={`grid grid-cols-[84px_minmax(0,1fr)_78px] items-center gap-3 py-3 text-xs sm:grid-cols-[104px_minmax(0,1fr)_96px] ${index ? "border-t border-line/40" : ""}`}>
                      <span className="truncate text-muted">{historyDayLabel(record.day)}</span>
                      <div className="relative h-2.5 overflow-hidden rounded-full bg-inset">
                        {record.steps != null ? (
                          <div
                            className={`h-full min-w-[3px] rounded-full ${hitGoal ? "bg-gradient-to-r from-gold to-teal" : "bg-gradient-to-r from-cyan/80 to-teal"}`}
                            style={{ width: `${progress}%` }}
                          />
                        ) : null}
                        <span className="absolute inset-y-0 w-px bg-gold/80" style={{ left: `${Math.min(100, (STEP_GOAL / stepMax) * 100)}%` }} />
                      </div>
                      <span className={`text-right font-medium ${record.steps == null ? "text-muted" : hitGoal ? "text-gold" : "text-ink"}`}>
                        {record.steps == null ? "No data" : valueOrDash(record.steps)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[24px] border border-line bg-raised/65 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Heart range</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-coral">
                      {today.heartRate?.minimum ?? "—"}<span className="mx-1 text-muted">–</span>{today.heartRate?.maximum ?? "—"}
                      <span className="ml-1.5 text-sm font-normal text-muted">bpm</span>
                    </p>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral/10 text-coral">
                    <Icon name="heart" className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-5 flex h-10 items-center gap-1" aria-hidden="true">
                  {[35, 56, 42, 76, 50, 88, 44, 65, 38, 58, 46, 72, 40, 61, 34, 52].map((height, index) => (
                    <span key={index} className="flex-1 rounded-full bg-coral/60" style={{ height: `${height}%`, opacity: 0.35 + (index / 28) }} />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">Today’s minimum and maximum recorded readings.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Insight label="Goal days" value={String(goalDays)} hint="Last 40 days" />
                <Insight label="Best day" value={bestDay?.steps == null ? "—" : valueOrDash(bestDay.steps)} hint={bestDay ? historyDayLabel(bestDay.day) : "No data"} />
              </div>

              <div className="rounded-[24px] border border-line bg-raised/65 p-5 sm:p-6">
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet">
                    <Icon name="info" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">About stress data</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Galaxy Fit3 measures stress, but Samsung currently keeps that score inside Samsung Health instead of sharing it through Health Connect.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, hint, tone }) {
  const tones = {
    teal: "bg-teal/10 text-teal",
    coral: "bg-coral/10 text-coral",
    cyan: "bg-cyan/10 text-cyan",
    gold: "bg-gold/10 text-gold",
  };
  return (
    <div className="group rounded-[20px] border border-line bg-raised/55 p-4 transition hover:-translate-y-0.5 hover:border-teal/25 hover:bg-raised/80 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-tight text-ink sm:text-2xl">{value}</p>
          <p className="mt-1.5 truncate text-xs text-muted">{hint}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function Insight({ label, value, hint }) {
  return (
    <div className="rounded-[20px] border border-line bg-raised/55 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 truncate text-[11px] text-muted">{hint}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 grid min-h-[420px] place-items-center rounded-[28px] border border-dashed border-line bg-raised/40 p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal/10 text-teal">
          <Icon name="steps" className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">No activity data yet</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Open BetterMe Health on your Android phone, grant Health Connect permissions, then tap Sync to BetterMe.
        </p>
      </div>
    </div>
  );
}
