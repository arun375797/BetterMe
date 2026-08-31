import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FoodAdherenceChart, {
  buildDayRows,
} from "../components/FoodAdherenceChart.jsx";
import SleepDurationChart from "../components/SleepDurationChart.jsx";
import SleepQualityCard from "../components/SleepQualityCard.jsx";
import { formatMinutes } from "../lib/sleepStats.js";
import { getMealLogs, getSleepLogs, getSugarReadings, peek } from "../api.js";

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

export default function HealthHomePage() {
  const [readings, setReadings] = useState(
    () => peek("/api/sugar", "/")?.readings || []
  );
  const [logs, setLogs] = useState(() => peek("/api/food", "/logs")?.logs || []);
  const [sleepLogs, setSleepLogs] = useState(
    () => peek("/api/sleep", "/")?.logs || []
  );
  const [sleepStats, setSleepStats] = useState(
    () => peek("/api/sleep", "/")?.stats || null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [sugar, food, sleep] = await Promise.all([
          getSugarReadings(),
          getMealLogs(),
          getSleepLogs(),
        ]);
        setReadings(sugar.readings || []);
        setLogs(food.logs || []);
        setSleepLogs(sleep.logs || []);
        setSleepStats(sleep.stats || null);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  const week = useMemo(
    () => readings.filter((item) => new Date(item.recordedAt) >= daysAgo(6)),
    [readings]
  );
  const today = useMemo(
    () => readings.filter((item) => new Date(item.recordedAt) >= daysAgo(0)),
    [readings]
  );
  const highCount = week.filter((item) => item.status === "high").length;
  const latest = readings[0];
  const rows = buildDayRows(logs, 30);
  const todayFood = rows[rows.length - 1];
  const completeDays = rows.filter((row) => row.complete).length;

  return (
    <div className="page-pad">
      <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
        My Health
      </p>
      <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">Overview</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Sugar, food, and sleep at a glance. Open each section for full logs and
        charts.
      </p>
      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            Sugar statistics
          </p>
          <h3 className="mt-1 text-lg font-semibold">Past 7 days</h3>
        </div>
        <Link to="/health/sugar" className="text-sm text-coral hover:underline">
          Open sugar page
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Latest"
          value={latest ? latest.level : "—"}
          hint={
            latest
              ? `${latest.mealTiming === "before" ? "Before" : "After"} food`
              : "No readings"
          }
        />
        <StatCard
          label="Today average"
          value={avg(today.map((item) => item.level)) ?? "—"}
          hint={`${today.length} today`}
        />
        <StatCard
          label="7-day average"
          value={avg(week.map((item) => item.level)) ?? "—"}
          hint={`${week.length} readings`}
        />
        <StatCard
          label="High this week"
          value={highCount}
          hint="Over the high cut-off"
        />
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            Food consumption
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Eaten vs missed across the four meals
          </h3>
        </div>
        <Link to="/health/food" className="text-sm text-coral hover:underline">
          Open food page
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Today"
          value={todayFood ? `${todayFood.eaten} / 4` : "—"}
          hint={
            todayFood?.complete
              ? "All four eaten"
              : `${todayFood?.skipped || 0} missed`
          }
        />
        <StatCard
          label="Complete days"
          value={completeDays}
          hint="Last 30 days"
        />
        <StatCard
          label="Meal logs"
          value={logs.length}
          hint="Including dummy history"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-[#222838]/80 p-5">
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal" />
            Eaten correctly
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" />
            Did not eat / not recorded
          </span>
        </div>
        <FoodAdherenceChart logs={logs} dayCount={30} />
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            Sleep
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Duration and quality from bed to wake
          </h3>
        </div>
        <Link to="/health/sleep" className="text-sm text-coral hover:underline">
          Open sleep page
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Last night"
          value={
            sleepStats?.lastNight
              ? formatMinutes(sleepStats.lastNight.durationMinutes)
              : "—"
          }
          hint={
            sleepStats?.lastNight
              ? `${sleepStats.lastNight.bedTime} → ${sleepStats.lastNight.wakeTime}`
              : "No entry yet"
          }
        />
        <StatCard
          label="Quality"
          value={
            sleepStats?.lastNight?.analysis?.overall != null
              ? sleepStats.lastNight.analysis.overall
              : "—"
          }
          hint={
            sleepStats?.lastNight?.analysis?.label || "Log sleep to score"
          }
        />
        <StatCard
          label="7-day average"
          value={
            sleepStats?.weekAvgMinutes
              ? formatMinutes(sleepStats.weekAvgMinutes)
              : "—"
          }
          hint="Hours per night"
        />
        <StatCard
          label="Good nights"
          value={sleepStats ? `${sleepStats.goodNights} / 7` : "—"}
          hint={
            sleepStats?.weekAvgScore != null
              ? `Avg score ${sleepStats.weekAvgScore}`
              : "Score 70+ counts as good"
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SleepQualityCard log={sleepStats?.lastNight} compact />
        <div className="rounded-2xl border border-line bg-[#222838]/80 p-5">
          <h4 className="text-sm font-semibold">30-day sleep</h4>
          <div className="mt-4">
            <SleepDurationChart logs={sleepLogs} dayCount={30} />
          </div>
        </div>
      </div>
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
