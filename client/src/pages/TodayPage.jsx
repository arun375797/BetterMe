import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { difficultyMeta } from "../difficulty.js";
import { todayKey } from "../food.js";
import { formatMinutes } from "../lib/sleepStats.js";
import {
  currentPeriodId,
  nextMeal,
  nextSugar,
  nextVitamin,
  notebookPath,
  periodLabel,
  pickPersonality,
  sessionIsToday,
  splitDueTodos,
} from "../lib/today.js";
import { PERSONALITY_SECTIONS } from "../personality.js";
import {
  getExerciseSessions,
  getMealLogs,
  getPersonalityItems,
  getReviewQueue,
  getSleepLogs,
  getSugarReadings,
  getTodos,
  getVitaminItems,
  peek,
  peekReviewQueue,
  updateTodo,
} from "../api.js";

const EXERCISE_LABEL = {
  yoga: "Yoga",
  badminton: "Badminton",
  weight: "Weight training",
};

const PRIORITY_DOT = {
  high: "bg-[#e88b7a]",
  medium: "bg-[#e8c36a]",
  low: "bg-[#3ce6d4]",
};

function fmtDue(dateStr) {
  const s = String(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  const utcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0;
  const localMidnight = d.getHours() === 0 && d.getMinutes() === 0;
  if (utcMidnight || localMidnight) return date;
  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
}

function headingDate(now) {
  return now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TodayPage() {
  const { todoCategories = [] } = useOutletContext();
  const [todos, setTodos] = useState(
    () => peek("/api/todos", "/?done=false")?.todos || []
  );
  const [review, setReview] = useState(() => peekReviewQueue() || []);
  const [vitamins, setVitamins] = useState(
    () => peek("/api/vitamins", "/")?.items || []
  );
  const [mealLogs, setMealLogs] = useState(
    () => peek("/api/food", "/logs")?.logs || []
  );
  const [readings, setReadings] = useState(
    () => peek("/api/sugar", "/")?.readings || []
  );
  const [sleepStats, setSleepStats] = useState(
    () => peek("/api/sleep", "/")?.stats || null
  );
  const [sessions, setSessions] = useState(
    () => peek("/api/exercise", "/")?.sessions || []
  );
  const [personalityItems, setPersonalityItems] = useState(
    () => peek("/api/personality", "/")?.items || []
  );
  const [error, setError] = useState("");
  const now = new Date();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [
          todoData,
          reviewData,
          vitaminData,
          foodData,
          sugarData,
          sleepData,
          exerciseData,
          personalityData,
        ] = await Promise.all([
          getTodos({ done: false }),
          getReviewQueue(),
          getVitaminItems(),
          getMealLogs(),
          getSugarReadings(),
          getSleepLogs(),
          getExerciseSessions(),
          getPersonalityItems(),
        ]);
        if (cancelled) return;
        setTodos(todoData.todos || []);
        setReview(reviewData || []);
        setVitamins(vitaminData.items || []);
        setMealLogs(foodData.logs || []);
        setReadings(sugarData.readings || []);
        setSleepStats(sleepData.stats || null);
        setSessions(exerciseData.sessions || []);
        setPersonalityItems(personalityData.items || []);
        setError("");
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const catMap = useMemo(
    () => Object.fromEntries(todoCategories.map((c) => [c._id, c])),
    [todoCategories]
  );
  const { overdue, dueToday } = useMemo(
    () => splitDueTodos(todos),
    [todos]
  );
  const reviewTop = review.slice(0, 3);
  const vitamin = useMemo(() => nextVitamin(vitamins), [vitamins]);
  const meal = useMemo(() => nextMeal(mealLogs), [mealLogs]);
  const sugar = useMemo(
    () => nextSugar(readings, meal),
    [readings, meal]
  );
  const personality = useMemo(
    () => pickPersonality(personalityItems),
    [personalityItems]
  );
  const exerciseToday = useMemo(
    () => sessions.filter((s) => sessionIsToday(s.recordedAt)),
    [sessions]
  );
  const period = periodLabel(currentPeriodId());
  const lastNight = sleepStats?.lastNight;
  const sleepIsLastNight =
    lastNight &&
    (lastNight.day === todayKey() || lastNight.wakeDate === todayKey());

  async function toggleTodo(todo) {
    const next = !todo.done;
    setTodos((list) =>
      list.map((item) =>
        item._id === todo._id ? { ...item, done: next } : item
      )
    );
    try {
      await updateTodo(todo._id, { done: next });
      if (next) {
        setTodos((list) => list.filter((item) => item._id !== todo._id));
      }
    } catch {
      setTodos((list) =>
        list.map((item) =>
          item._id === todo._id ? { ...item, done: todo.done } : item
        )
      );
    }
  }

  return (
    <div className="page-pad mx-auto max-w-3xl">
      <p className="text-[12px] tracking-[0.18em] text-teal uppercase">
        Today · {period}
      </p>
      <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">
        {headingDate(now)}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        What to do in the next few hours — pulled from what you already track.
      </p>
      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      <Section
        kicker="Todos"
        title="Overdue and due"
        to="/todos"
        linkLabel="All todos"
      >
        {!overdue.length && !dueToday.length ? (
          <p className="text-sm text-muted">
            Nothing due right now. Open todos if you want to add one.
          </p>
        ) : (
          <ul className="space-y-2">
            {overdue.map((todo) => (
              <TodoRow
                key={todo._id}
                todo={todo}
                category={todo.categoryId ? catMap[todo.categoryId] : null}
                overdue
                onToggle={() => toggleTodo(todo)}
              />
            ))}
            {dueToday.map((todo) => (
              <TodoRow
                key={todo._id}
                todo={todo}
                category={todo.categoryId ? catMap[todo.categoryId] : null}
                onToggle={() => toggleTodo(todo)}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section
        kicker="Learning"
        title="Review queue"
        to="/learning"
        linkLabel="Learning"
      >
        {!reviewTop.length ? (
          <p className="text-sm text-muted">
            Nothing in review. Mark a notebook or question Add to review and it
            will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {reviewTop.map((item) => (
              <li key={item._id}>
                <Link
                  to={notebookPath(item)}
                  className="flex flex-wrap items-start gap-3 rounded-2xl border border-line bg-[#222838]/80 px-4 py-3 transition hover:border-white/15 sm:items-center"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-medium">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted">
                      {item.subject?.shortName || item.subject?.name} ·{" "}
                      {item.parentTopic?.title || "Topic"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
                      difficultyMeta(item.difficulty).className
                    }`}
                  >
                    {difficultyMeta(item.difficulty).label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {review.length > 3 ? (
          <p className="mt-3 text-xs text-muted">
            {review.length - 3} more in the full queue on Learning.
          </p>
        ) : null}
      </Section>

      <Section kicker="Health" title="Next checks">
        <div className="grid gap-2">
          <CheckRow
            to="/health/vitamin"
            label="Vitamin"
            value={
              vitamin
                ? vitamin.now
                  ? `${periodLabel(vitamin.period)} — now`
                  : `Next: ${periodLabel(vitamin.period)}`
                : "No vitamins saved"
            }
            hint={
              vitamin
                ? vitamin.items.map((item) => item.name).join(", ") +
                  (vitamin.more ? ` +${vitamin.more}` : "")
                : "Add items on the vitamin page"
            }
          />
          <CheckRow
            to="/health/food"
            label="Meal"
            value={
              meal?.done
                ? "All four logged as eaten"
                : meal?.overdue
                  ? `${periodLabel(meal.slot)} — still open`
                  : meal
                    ? `${periodLabel(meal.slot)}${meal.now ? " — now" : ""}`
                    : "Open food"
            }
            hint={
              meal?.done
                ? "Nice work"
                : meal?.status === "skipped"
                  ? meal.foodName
                    ? `Skipped · ${meal.foodName}`
                    : "Skipped — log if you eat"
                  : meal?.foodName || "Not logged yet"
            }
          />
          <CheckRow
            to="/health/sugar"
            label="Sugar"
            value={sugar.action}
            hint={sugar.hint}
          />
        </div>
      </Section>

      <Section kicker="Body" title="Sleep and exercise">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            to="/health/sleep"
            className="rounded-2xl border border-line bg-[#222838]/80 p-4 transition hover:border-white/15"
          >
            <p className="text-xs text-muted">Last sleep</p>
            <p className="mt-2 text-xl font-semibold">
              {lastNight
                ? formatMinutes(lastNight.durationMinutes)
                : "Not logged"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {lastNight
                ? `${lastNight.bedTime} → ${lastNight.wakeTime}${
                    lastNight.analysis?.label
                      ? ` · ${lastNight.analysis.label}`
                      : ""
                  }`
                : "Open sleep to add last night"}
            </p>
            {lastNight && !sleepIsLastNight ? (
              <p className="mt-2 text-[11px] text-gold">
                Last entry is not today — log last night if you have not.
              </p>
            ) : null}
          </Link>
          <Link
            to="/health/exercise"
            className="rounded-2xl border border-line bg-[#222838]/80 p-4 transition hover:border-white/15"
          >
            <p className="text-xs text-muted">Exercise today</p>
            <p className="mt-2 text-xl font-semibold">
              {exerciseToday.length
                ? `${exerciseToday.reduce(
                    (sum, s) => sum + (s.durationMinutes || 0),
                    0
                  )} min`
                : "Not logged"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {exerciseToday.length
                ? exerciseToday
                    .map((s) => EXERCISE_LABEL[s.kind] || s.kind)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .join(" · ")
                : "Yoga, badminton, or weights"}
            </p>
          </Link>
        </div>
      </Section>

      <Section
        kicker="Personality"
        title="One thing to grow"
        to={
          personality
            ? `/personality/${personality.section}/${personality._id}`
            : "/personality/english"
        }
        linkLabel={personality ? "Open" : "Personality"}
      >
        {personality ? (
          <Link
            to={`/personality/${personality.section}/${personality._id}`}
            className="block rounded-2xl border border-line bg-[#222838]/80 p-4 transition hover:border-white/15"
          >
            <p className="text-xs text-violet">
              {PERSONALITY_SECTIONS[personality.section]?.label ||
                personality.section}
            </p>
            <p className="mt-1 text-lg font-semibold break-words">
              {personality.title}
            </p>
            {personality.subtitle ? (
              <p className="mt-1 text-sm text-muted">{personality.subtitle}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {personality.details || "Open the card and spend a few minutes."}
              </p>
            )}
          </Link>
        ) : (
          <p className="text-sm text-muted">
            Add an English card, a book, or a talk under My Personality and one
            will rotate here each day.
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({ kicker, title, to, linkLabel, children }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            {kicker}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        </div>
        {to ? (
          <Link to={to} className="text-sm text-teal hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function CheckRow({ to, label, value, hint }) {
  return (
    <Link
      to={to}
      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-[#222838]/80 px-4 py-3 transition hover:border-white/15"
    >
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 font-medium break-words">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
      <span className="shrink-0 text-xs text-coral">Open</span>
    </Link>
  );
}

function TodoRow({ todo, category, overdue, onToggle }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-[#222838]/80 px-3 py-3">
      <button
        type="button"
        onClick={onToggle}
        aria-label={todo.done ? "Mark not done" : "Mark done"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          todo.done
            ? "border-teal/50 bg-teal/20 text-teal"
            : "border-line bg-[#171c2a] text-transparent hover:border-teal/40"
        }`}
      >
        {todo.done ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
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
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed">{todo.text}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              PRIORITY_DOT[todo.priority] || PRIORITY_DOT.medium
            }`}
          />
          {category ? (
            <span
              className="text-[11px]"
              style={{ color: category.color }}
            >
              {category.emoji ? `${category.emoji} ` : ""}
              {category.name}
            </span>
          ) : null}
          {todo.dueDate ? (
            <span className={`text-[11px] ${overdue ? "text-coral" : "text-gold"}`}>
              {overdue ? "Overdue " : "Due "}
              {fmtDue(todo.dueDate)}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
