import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import ExerciseSessionModal from "../components/ExerciseSessionModal.jsx";
import { KINDS } from "../components/ExerciseMinutesChart.jsx";
import {
  createExerciseSession,
  deleteExerciseSession,
  getExerciseSessions,
  peek,
  updateExerciseSession,
} from "../api.js";

function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExerciseKindPage() {
  const { kind } = useParams();
  const meta = KINDS.find((item) => item.id === kind);
  const [sessions, setSessions] = useState(
    () =>
      peek("/api/exercise", `/?kind=${encodeURIComponent(kind)}`)?.sessions ||
      []
  );
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  async function load() {
    try {
      const data = await getExerciseSessions(kind);
      setSessions(data.sessions || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (meta) load();
  }, [kind]);

  if (!meta) {
    return <Navigate to="/health/exercise" replace />;
  }

  async function handleSave(payload) {
    if (modal?.session?._id) {
      await updateExerciseSession(modal.session._id, payload);
    } else {
      await createExerciseSession(payload);
    }
    await load();
  }

  async function handleDelete(id) {
    await deleteExerciseSession(id);
    await load();
  }

  const totalMinutes = sessions.reduce(
    (sum, item) => sum + (item.durationMinutes || 0),
    0
  );
  const feltAvg = useMemo(() => {
    const rated = sessions.filter((item) => item.felt != null);
    if (!rated.length) return null;
    return Math.round(
      (rated.reduce((sum, item) => sum + item.felt, 0) / rated.length) * 10
    ) / 10;
  }, [sessions]);

  return (
    <div className="page-pad">
      <Link
        to="/health/exercise"
        className="text-sm text-muted hover:text-ink"
      >
        ← All exercise
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-coral uppercase">
            My Health · Exercise
          </p>
          <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">{meta.label}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {meta.hint}. Log what you did, why you chose it today, and when.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ session: null })}
          className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-[#2a1410]"
        >
          Log {meta.label.toLowerCase()}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatCard label="Sessions" value={sessions.length} hint="all time" />
        <StatCard
          label="Total time"
          value={`${totalMinutes} min`}
          hint="logged minutes"
        />
        <StatCard
          label="Avg felt"
          value={feltAvg ?? "—"}
          hint="1–10 when you rated it"
        />
      </div>

      {sessions.length ? (
        <ul className="mt-8 space-y-3">
          {sessions.map((item) => (
            <li
              key={item._id}
              className="rounded-2xl border border-line bg-[#222838]/80 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">
                    {formatWhen(item.recordedAt)} · {item.durationMinutes} min
                    {item.felt != null ? ` · felt ${item.felt}/10` : ""}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="text-muted">What · </span>
                    {item.what}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-muted">Why · </span>
                    {item.why}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ session: item })}
                    className="text-xs text-muted hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="text-xs text-muted hover:text-coral"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          No {meta.label.toLowerCase()} sessions yet. Log the first one with
          what you did and why.
        </p>
      )}

      {modal ? (
        <ExerciseSessionModal
          kind={kind}
          kindLabel={meta.label}
          session={modal.session}
          onClose={() => setModal(null)}
          onSubmit={handleSave}
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
