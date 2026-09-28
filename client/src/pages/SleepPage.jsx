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

function formatDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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

  return (
    <div className="page-pad">
      <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
        My Health · Sleep
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold break-words sm:text-3xl">
            Sleep tracker
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Fit3 entries show recorded sleep and actual asleep time derived from
            Health Connect stages. Samsung&apos;s proprietary sleep score is not available.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ log: null })}
          className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-[#2a1410]"
        >
          Log sleep
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {[['health_connect', 'Fit3'], ['manual', 'Manual'], ['all', 'All']].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setSource(value)} className={`rounded-full border px-3 py-1.5 text-xs ${source === value ? 'border-coral bg-coral/10 text-ink' : 'border-line text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Last night"
          value={
            stats?.lastNight
              ? formatMinutes(stats.lastNight.durationMinutes)
              : "—"
          }
          hint={
            stats?.lastNight
              ? `${stats.lastNight.bedTime} → ${stats.lastNight.wakeTime}`
              : "No entry yet"
          }
        />
        <StatCard
          label={source === "manual" ? "Quality score" : "Actual asleep"}
          value={
            source !== "manual" && stats?.lastNight?.actualSleepMinutes != null
              ? formatMinutes(stats.lastNight.actualSleepMinutes)
              : stats?.lastNight?.analysis?.overall != null
              ? stats.lastNight.analysis.overall
              : "—"
          }
          hint={
            source === "manual"
              ? stats?.lastNight?.analysis?.label || "Manual estimate"
              : "From non-awake Health Connect stages"
          }
        />
        <StatCard
          label="7-day average"
          value={weekAvg}
          hint="Hours per night"
        />
        <StatCard
          label="Good nights"
          value={stats ? `${stats.goodNights} / 7` : "—"}
          hint={`Avg score ${weekScore}`}
        />
      </div>

      {source === "manual" ? <div className="mt-8"><SleepQualityCard log={stats?.lastNight} /></div> : null}

      <div className="mt-8 rounded-2xl border border-line bg-raised/80 p-5">
        <h3 className="text-lg font-semibold">30-day history</h3>
        <div className="mt-4">
          <SleepDurationChart logs={logs} dayCount={30} />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Recent entries</h3>
        {recentLogs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No sleep logged yet. Tap &quot;Log sleep&quot; to add your first
            entry.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentLogs.map((log) => (
              <li
                key={log._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-raised/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{formatDay(log.day)}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {log.bedTime} → {log.wakeTime} ·{" "}
                    {formatMinutes(log.durationMinutes)}
                  </p>
                  {log.source === "health_connect" ? (
                    <p className="mt-1 text-xs text-cyan">
                      Fit3 · {log.actualSleepMinutes != null ? `${formatMinutes(log.actualSleepMinutes)} actual asleep` : "actual sleep unavailable"}
                      {log.episodes?.length > 1 ? ` · ${log.episodes.length - 1} additional episode/nap` : ""}
                    </p>
                  ) : <p className="mt-1 text-xs text-gold">Manual entry</p>}
                  {log.notes ? (
                    <p className="mt-1 text-xs text-muted">{log.notes}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {log.analysis ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        color: log.analysis.color,
                        backgroundColor: `${log.analysis.color}22`,
                      }}
                    >
                      {log.analysis.overall} · {log.analysis.label}
                    </span>
                  ) : null}
                  {log.source !== "health_connect" ? <button type="button" onClick={() => setModal({ log })} className="text-sm text-coral hover:underline">Edit</button> : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(log._id)}
                    className="text-sm text-muted hover:text-coral"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-raised/80 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
