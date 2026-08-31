import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ExerciseMinutesChart, {
  KINDS,
  buildExerciseDays,
} from "../components/ExerciseMinutesChart.jsx";
import { getExerciseSessions, peek } from "../api.js";

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function streakFrom(rows) {
  let streak = 0;
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i].minutes > 0) streak += 1;
    else if (i !== rows.length - 1 || streak === 0) break;
  }
  if (rows[rows.length - 1]?.minutes === 0 && streak === 0) {
    for (let i = rows.length - 2; i >= 0; i -= 1) {
      if (rows[i].minutes > 0) streak += 1;
      else break;
    }
  }
  return streak;
}

export default function ExercisePage() {
  const [sessions, setSessions] = useState(
    () => peek("/api/exercise", "/")?.sessions || []
  );
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getExerciseSessions();
        setSessions(data.sessions || []);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  const rows = useMemo(() => buildExerciseDays(sessions, 30), [sessions]);
  const today = rows[rows.length - 1];
  const week = rows.slice(-7);
  const weekMinutes = week.reduce((sum, row) => sum + row.minutes, 0);
  const activeDays = rows.filter((row) => row.minutes > 0).length;
  const feltSessions = sessions.filter((item) => item.felt != null);
  const feltAvg = feltSessions.length
    ? Math.round(
        (feltSessions.reduce((sum, item) => sum + item.felt, 0) /
          feltSessions.length) *
          10
      ) / 10
    : null;
  const recentFelt = [...feltSessions]
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .slice(-7);
  const earlierFelt = [...feltSessions]
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .slice(-14, -7);
  const recentAvg = recentFelt.length
    ? recentFelt.reduce((sum, item) => sum + item.felt, 0) / recentFelt.length
    : null;
  const earlierAvg = earlierFelt.length
    ? earlierFelt.reduce((sum, item) => sum + item.felt, 0) / earlierFelt.length
    : null;
  const improvement =
    recentAvg != null && earlierAvg != null
      ? Math.round((recentAvg - earlierAvg) * 10) / 10
      : null;
  const streak = streakFrom(rows);

  const byKind = KINDS.map((kind) => {
    const list = sessions.filter((item) => item.kind === kind.id);
    const last7 = list.filter(
      (item) => new Date(item.recordedAt) >= daysAgo(6)
    );
    return {
      ...kind,
      count: list.length,
      weekMinutes: last7.reduce(
        (sum, item) => sum + (item.durationMinutes || 0),
        0
      ),
      last: list[0],
    };
  });

  return (
    <div className="page-pad">
      <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
        My Health · Exercise
      </p>
      <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">Daily movement</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Yoga, badminton, and weight training each keep their own log. This
        page shows how minutes and how you felt change day by day.
      </p>
      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={today ? `${today.minutes} min` : "—"}
          hint={today?.count ? `${today.count} session(s)` : "No session yet"}
        />
        <StatCard
          label="This week"
          value={`${weekMinutes} min`}
          hint={`${week.filter((row) => row.minutes > 0).length} active days`}
        />
        <StatCard
          label="Active days"
          value={activeDays}
          hint={`${streak} day streak`}
        />
        <StatCard
          label="How it felt"
          value={feltAvg ?? "—"}
          hint={
            improvement != null
              ? `${improvement > 0 ? "+" : ""}${improvement} vs prior week`
              : "Optional 1–10 score"
          }
        />
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {byKind.map((kind) => (
          <Link
            key={kind.id}
            to={`/health/exercise/${kind.id}`}
            className="rounded-2xl border border-line bg-[#222838]/80 p-5 hover:border-coral/40"
          >
            <p className="text-[12px] tracking-[0.16em] text-muted uppercase">
              {kind.label}
            </p>
            <h3 className="mt-1 text-xl font-semibold">{kind.label}</h3>
            <p className="mt-1 text-sm text-muted">{kind.hint}</p>
            <p className="mt-4 text-2xl font-semibold">
              {kind.weekMinutes} min
            </p>
            <p className="mt-1 text-xs text-muted">
              This week · {kind.count} total sessions
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-[#222838]/80 p-5">
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
          {KINDS.map((kind) => (
            <span key={kind.id} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: kind.color }}
              />
              {kind.label}
            </span>
          ))}
        </div>
        <ExerciseMinutesChart sessions={sessions} dayCount={30} />
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
