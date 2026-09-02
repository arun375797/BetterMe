import { useEffect, useMemo, useRef, useState } from "react";
import {
  createStudyGoal,
  deleteStudyGoal,
  getStudyGoals,
  peekStudyGoals,
  updateStudyGoal,
} from "../api.js";

export default function StudyGoalsPanel({ slug, section }) {
  const [goals, setGoals] = useState(
    () => peekStudyGoals(slug, section)?.goals || []
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(true);
  const loadSeq = useRef(0);

  async function refreshGoals() {
    const seq = ++loadSeq.current;
    const data = await getStudyGoals(slug, section);
    if (seq !== loadSeq.current) return;
    setGoals(data.goals || []);
  }

  useEffect(() => {
    const cached = peekStudyGoals(slug, section)?.goals;
    setGoals(cached || []);
    setDraft("");
    setError("");
    let live = true;
    const seq = ++loadSeq.current;
    getStudyGoals(slug, section)
      .then((data) => {
        if (!live || seq !== loadSeq.current) return;
        setGoals(data.goals || []);
      })
      .catch((err) => {
        if (live && seq === loadSeq.current) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [slug, section]);

  const open = useMemo(() => goals.filter((item) => !item.done), [goals]);
  const done = useMemo(() => goals.filter((item) => item.done), [goals]);
  const total = goals.length;
  const doneCount = done.length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  async function addGoal(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await createStudyGoal(slug, { section, text });
      loadSeq.current += 1;
      setGoals((prev) => [
        ...prev.filter((item) => !item.done),
        created,
        ...prev.filter((item) => item.done),
      ]);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(goal) {
    const next = !goal.done;
    setGoals((prev) =>
      prev
        .map((item) =>
          item._id === goal._id
            ? { ...item, done: next, completedAt: next ? new Date().toISOString() : null }
            : item
        )
        .sort((a, b) => Number(a.done) - Number(b.done) || (a.order || 0) - (b.order || 0))
    );
    try {
      await updateStudyGoal(goal._id, { done: next }, slug);
      loadSeq.current += 1;
    } catch (err) {
      setError(err.message);
      await refreshGoals().catch(() => {});
    }
  }

  async function remove(goal) {
    const previous = goals;
    setGoals((prev) => prev.filter((item) => item._id !== goal._id));
    try {
      await deleteStudyGoal(goal._id, slug);
      loadSeq.current += 1;
    } catch (err) {
      setError(err.message);
      setGoals(previous);
    }
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-teal uppercase">
            Study focus
          </p>
          <h4 className="mt-1 text-sm font-semibold">To learn here</h4>
        </div>
        <span className="rounded-full border border-teal/25 bg-teal/10 px-2 py-0.5 text-[11px] text-teal">
          {doneCount}/{total || 0}
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-teal transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <form onSubmit={addGoal} className="mt-4">
        <label className="sr-only" htmlFor={`study-goal-${slug}-${section}`}>
          Add something to learn
        </label>
        <div className="flex gap-2">
          <input
            id={`study-goal-${slug}-${section}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. path & query params"
            maxLength={240}
            className="min-w-0 flex-1 rounded-xl border border-line bg-[#171c2a] px-3 py-2 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="shrink-0 rounded-xl bg-teal px-3 py-2 text-sm font-semibold text-[#10201e] disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </form>

      {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}

      <ul className="mt-4 space-y-1.5">
        {open.length ? (
          open.map((goal) => (
            <GoalRow key={goal._id} goal={goal} onToggle={toggle} onRemove={remove} />
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-line px-3 py-3 text-xs leading-5 text-muted">
            {done.length
              ? "All caught up. Add the next thing you want to cover."
              : `Add what you want to cover in this ${section} track. Check it off when you finish.`}
          </li>
        )}
      </ul>

      {done.length ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDone((value) => !value)}
            className="flex w-full items-center justify-between text-[11px] tracking-[0.12em] text-muted uppercase hover:text-ink"
          >
            <span>Completed · {done.length}</span>
            <span>{showDone ? "Hide" : "Show"}</span>
          </button>
          {showDone ? (
            <ul className="mt-2 space-y-1.5">
              {done.map((goal) => (
                <GoalRow
                  key={goal._id}
                  goal={goal}
                  onToggle={toggle}
                  onRemove={remove}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GoalRow({ goal, onToggle, onRemove }) {
  return (
    <li
      className={`group flex items-start gap-2 rounded-xl border px-2.5 py-2 ${
        goal.done
          ? "border-line/40 bg-white/[0.02]"
          : "border-line/70 bg-[#171c2a]/80"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(goal)}
        aria-label={goal.done ? "Mark as not done" : "Mark as done"}
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          goal.done
            ? "border-teal bg-teal text-[#10201e]"
            : "border-line hover:border-teal/70"
        }`}
      >
        {goal.done ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>
      <p
        className={`min-w-0 flex-1 text-[13px] leading-5 ${
          goal.done ? "text-muted line-through" : "text-ink"
        }`}
      >
        {goal.text}
      </p>
      <button
        type="button"
        onClick={() => onRemove(goal)}
        aria-label={`Remove ${goal.text}`}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted opacity-70 hover:bg-white/8 hover:text-coral sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path
            d="M3 3l6 6M9 3l-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}
