import { useEffect, useMemo, useState } from "react";
import SleepDurationChart from "../components/SleepDurationChart.jsx";
import SleepLogModal from "../components/SleepLogModal.jsx";
import SleepQualityCard from "../components/SleepQualityCard.jsx";
import { formatMinutes } from "../lib/sleepStats.js";
import {
  createSleepLog,
  deleteSleepLog,
  getSleepLogs,
  peek,
  updateSleepLog,
} from "../api.js";

const SOURCE_OPTIONS = [
  ["health_connect", "Fit3"],
  ["manual", "Manual"],
  ["all", "All"],
];

const STAGE_STYLES = {
  awake: { label: "Awake", color: "var(--color-gold)" },
  light: { label: "Light", color: "var(--color-cyan)" },
  deep: { label: "Deep", color: "#6878e8" },
  rem: { label: "REM", color: "var(--color-violet)" },
};

function formatDayParts(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
    month: date.toLocaleDateString(undefined, { month: "short" }),
    day: date.toLocaleDateString(undefined, { day: "numeric" }),
    full: date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  };
}

function normalizeStages(stageMinutes) {
  const entries = Object.entries(stageMinutes || {})
    .map(([name, minutes]) => [name.toLowerCase(), Math.round(Number(minutes) || 0)])
    .filter(([, minutes]) => minutes > 0);

  const order = ["awake", "light", "deep", "rem"];
  return entries.sort(
    ([first], [second]) => order.indexOf(first) - order.indexOf(second)
  );
}

function MoonIcon({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20.6 15.1A8.5 8.5 0 0 1 8.9 3.4 8.5 8.5 0 1 0 20.6 15Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
    </svg>
  );
}

export default function SleepPage() {
  const [source, setSource] = useState("health_connect");
  const [logs, setLogs] = useState(
    () => peek("/api/sleep", "/?source=health_connect")?.logs || []
  );
  const [stats, setStats] = useState(
    () => peek("/api/sleep", "/?source=health_connect")?.stats || null
  );
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  async function load() {
    try {
      const data = await getSleepLogs(source);
      setLogs(data.logs || []);
      setStats(data.stats || null);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [source]);

  async function handleSave(payload) {
    if (modal?.log?._id) {
      await updateSleepLog(modal.log._id, payload);
    } else {
      await createSleepLog(payload);
    }
    await load();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this sleep entry?")) return;
    await deleteSleepLog(id);
    await load();
  }

  const weekAvg = stats?.weekAvgMinutes
    ? formatMinutes(stats.weekAvgMinutes)
    : "—";
  const weekScore = stats?.weekAvgScore ?? "—";
  const recentLogs = useMemo(() => logs.slice(0, 14), [logs]);
  const lastNight = stats?.lastNight;
  const lastNightValue = lastNight
    ? formatMinutes(
        lastNight.actualSleepMinutes ?? lastNight.durationMinutes
      )
    : "—";
  const lastNightLabel =
    lastNight?.actualSleepMinutes != null ? "actual sleep" : "recorded sleep";

  return (
    <div className="page-pad">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-cyan uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_12px_var(--color-cyan)]" />
            My Health · Recovery
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Your sleep
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Follow your sleep window, actual rest, and stage balance from Fit3,
            or add a manual entry when your wearable is unavailable.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ log: null })}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-sm font-semibold text-[#08151d] shadow-[0_12px_30px_color-mix(in_oklab,var(--color-cyan)_18%,transparent)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan sm:w-auto"
        >
          <PlusIcon />
          Log sleep
        </button>
      </header>

      {error ? (
        <p className="mt-5 rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Sleep source">
        {SOURCE_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSource(value)}
            aria-pressed={source === value}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              source === value
                ? "border-cyan/35 bg-cyan/10 text-cyan shadow-[0_0_18px_color-mix(in_oklab,var(--color-cyan)_10%,transparent)]"
                : "border-line text-muted hover:border-cyan/30 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-line/80 bg-[linear-gradient(125deg,color-mix(in_oklab,var(--ui-raised)_96%,transparent),color-mix(in_oklab,var(--ui-surface)_90%,transparent))] shadow-[0_24px_70px_rgba(0,0,0,0.18)]" aria-label="Sleep summary">
        <div className="pointer-events-none absolute -right-24 -bottom-36 h-72 w-72 rounded-full bg-violet/8" />
        <div className="relative grid sm:grid-cols-2 xl:grid-cols-[1.25fr_repeat(3,minmax(140px,0.55fr))]">
          <div className="flex items-center gap-4 border-b border-line/70 px-5 py-5 sm:col-span-2 xl:col-span-1 xl:border-r xl:border-b-0 xl:px-6">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan/25 bg-cyan/10 text-cyan">
              <MoonIcon />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
                Latest night
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {lastNightValue}{" "}
                <span className="text-xs font-normal tracking-normal text-muted">
                  {lastNight ? lastNightLabel : "no entry yet"}
                </span>
              </p>
            </div>
          </div>
          <SummaryStat
            label="Sleep window"
            value={lastNight ? `${lastNight.bedTime} → ${lastNight.wakeTime}` : "—"}
          />
          <SummaryStat label="7-day average" value={weekAvg} />
          <SummaryStat
            label="Good nights"
            value={stats ? `${stats.goodNights} / 7` : "—"}
            hint={stats ? `Average score ${weekScore}` : "No trend yet"}
            last
          />
        </div>
      </section>

      {source === "manual" ? (
        <div className="mt-8">
          <SleepQualityCard log={lastNight} />
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="recent-sleep-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="recent-sleep-heading" className="text-xl font-semibold tracking-tight">
              Recent entries
              <span className="ml-2 align-middle text-xs font-normal text-muted">
                {recentLogs.length} {recentLogs.length === 1 ? "night" : "nights"}
              </span>
            </h3>
            <p className="mt-1 text-xs text-muted">Your latest 14 recorded nights</p>
          </div>
          <StageLegend />
        </div>

        {recentLogs.length === 0 ? (
          <div className="mt-4 grid min-h-44 place-items-center rounded-2xl border border-dashed border-line bg-raised/35 p-6 text-center">
            <div>
              <MoonIcon className="mx-auto h-7 w-7 text-cyan" />
              <p className="mt-3 text-sm font-medium">No sleep logged yet</p>
              <p className="mt-1 text-xs text-muted">
                Log last night or sync Fit3 to see your sleep pattern here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentLogs.map((log) => (
              <SleepEntry
                key={log._id}
                log={log}
                onEdit={() => setModal({ log })}
                onDelete={() => handleDelete(log._id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-line bg-raised/70 p-4 sm:p-5" aria-labelledby="sleep-history-heading">
        <div>
          <h3 id="sleep-history-heading" className="text-lg font-semibold">40-day history</h3>
          <p className="mt-1 text-xs text-muted">Duration and consistency over time</p>
        </div>
        <div className="mt-4">
          <SleepDurationChart logs={logs} dayCount={40} />
        </div>
      </section>

      {modal ? (
        <SleepLogModal
          log={modal.log}
          onClose={() => setModal(null)}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}

function SummaryStat({ label, value, hint, last = false }) {
  return (
    <div className={`px-5 py-4 sm:py-5 ${last ? "border-t border-line/70 sm:col-span-2 xl:col-span-1 xl:border-t-0" : "border-r border-line/70"}`}>
      <p className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{label}</p>
      <p className="mt-1.5 text-base font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

function StageLegend() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted" aria-label="Sleep stage legend">
      {Object.entries(STAGE_STYLES).map(([key, stage]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
          {stage.label}
        </span>
      ))}
    </div>
  );
}

function SleepEntry({ log, onEdit, onDelete }) {
  const date = formatDayParts(log.day);
  const stages = normalizeStages(log.stageMinutes);
  const totalStageMinutes = stages.reduce((sum, [, minutes]) => sum + minutes, 0);
  const isFit3 = log.source === "health_connect";

  return (
    <li className="group grid grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-line/80 bg-[linear-gradient(115deg,color-mix(in_oklab,var(--ui-raised)_82%,transparent),color-mix(in_oklab,var(--ui-surface)_72%,transparent))] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:border-cyan/25 hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] md:grid-cols-[68px_minmax(210px,0.8fr)_minmax(280px,1.4fr)_auto] md:gap-5">
      <div className="grid h-16 w-[60px] place-content-center rounded-xl border border-line/70 bg-white/[0.025] text-center" aria-label={date.full}>
        <span className="text-[10px] font-semibold tracking-[0.13em] text-muted uppercase">{date.weekday}</span>
        <span className="mt-0.5 text-xl font-semibold leading-none">{date.day}</span>
        <span className="mt-1 text-[9px] text-muted">{date.month}</span>
      </div>

      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold tabular-nums">{log.bedTime}</span>
          <span className="text-muted/60">→</span>
          <span className="font-semibold tabular-nums">{log.wakeTime}</span>
          <span className="text-xs font-semibold text-cyan">{formatMinutes(log.durationMinutes)}</span>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className={`rounded-md px-2 py-0.5 font-semibold ${isFit3 ? "bg-cyan/10 text-cyan" : "bg-gold/10 text-gold"}`}>
            {isFit3 ? "Fit3" : "Manual"}
          </span>
          {isFit3
            ? log.actualSleepMinutes != null
              ? `${formatMinutes(log.actualSleepMinutes)} actual sleep`
              : "Actual sleep unavailable"
            : log.analysis
              ? `${log.analysis.overall} · ${log.analysis.label}`
              : "Self-reported entry"}
        </p>
        {log.episodes?.length > 1 ? (
          <p className="mt-1.5 text-[11px] text-muted">
            {log.episodes.length} sleep episodes combined
          </p>
        ) : null}
      </div>

      <div className="col-span-3 min-w-0 md:col-auto">
        {stages.length ? (
          <>
            <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.04]" aria-label="Sleep stage distribution">
              {stages.map(([name, minutes]) => {
                const stage = STAGE_STYLES[name] || { label: name, color: "var(--color-muted)" };
                return (
                  <span
                    key={name}
                    title={`${stage.label}: ${formatMinutes(minutes)}`}
                    className="min-w-[3px] first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(minutes / totalStageMinutes) * 100}%`, backgroundColor: stage.color }}
                  />
                );
              })}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-muted">
              {stages.map(([name, minutes]) => {
                const stage = STAGE_STYLES[name] || { label: name };
                return (
                  <span key={name}>
                    {stage.label} <b className="font-semibold text-ink/85">{formatMinutes(minutes)}</b>
                  </span>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line/70" />
            Sleep stages unavailable
            <span className="h-px flex-1 bg-line/70" />
          </div>
        )}
        {log.notes && !isFit3 ? (
          <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted">{log.notes}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-1">
        {!isFit3 ? (
          <button
            type="button"
            onClick={onEdit}
            className="grid h-9 w-9 place-items-center rounded-lg border border-transparent text-muted transition hover:border-line hover:bg-white/[0.04] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            aria-label={`Edit ${date.full} sleep entry`}
            title="Edit entry"
          >
            <EditIcon />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="grid h-9 w-9 place-items-center rounded-lg border border-transparent text-muted transition hover:border-coral/20 hover:bg-coral/10 hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          aria-label={`Delete ${date.full} sleep entry`}
          title="Delete entry"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
