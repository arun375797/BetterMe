import { todayKey } from "../food.js";

export const PERIODS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

const PERIOD_IDS = PERIODS.map((p) => p.id);

export function periodLabel(id) {
  return PERIODS.find((p) => p.id === id)?.label || id;
}

export function currentPeriodId(now = new Date()) {
  const h = now.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "afternoon";
  if (h >= 16 && h < 20) return "evening";
  return "night";
}

export function startOfDay(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dueDay(dueDate) {
  const s = String(dueDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function dueTimeMs(dueDate) {
  const s = String(dueDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return 0;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getHours() * 60 + d.getMinutes();
}

export function splitDueTodos(todos, now = new Date()) {
  const today = startOfDay(now).getTime();
  const overdue = [];
  const dueToday = [];
  for (const todo of todos || []) {
    if (todo.done || !todo.dueDate) continue;
    const day = dueDay(todo.dueDate);
    if (!day) continue;
    const t = day.getTime();
    if (t < today) overdue.push(todo);
    else if (t === today) dueToday.push(todo);
  }
  const byDue = (a, b) =>
    dueDay(a.dueDate) - dueDay(b.dueDate) ||
    dueTimeMs(a.dueDate) - dueTimeMs(b.dueDate);
  overdue.sort(byDue);
  dueToday.sort((a, b) => dueTimeMs(a.dueDate) - dueTimeMs(b.dueDate));
  return { overdue, dueToday };
}

function rotateFrom(currentId) {
  const idx = PERIOD_IDS.indexOf(currentId);
  const start = idx >= 0 ? idx : 0;
  return [...PERIOD_IDS.slice(start), ...PERIOD_IDS.slice(0, start)];
}

export function nextVitamin(items, now = new Date()) {
  const list = items || [];
  if (!list.length) return null;
  const current = currentPeriodId(now);
  for (const period of rotateFrom(current)) {
    const match = list.filter((item) => item.timings?.includes(period));
    if (match.length) {
      return {
        period,
        now: period === current,
        items: match.slice(0, 4),
        more: Math.max(0, match.length - 4),
      };
    }
  }
  return null;
}

export function nextMeal(logs, now = new Date()) {
  const day = todayKey(now);
  const bySlot = {};
  for (const log of logs || []) {
    if (log.day === day) bySlot[log.slot] = log;
  }
  const current = currentPeriodId(now);
  for (const slot of PERIOD_IDS) {
    const log = bySlot[slot];
    if (!log || log.status !== "eaten") {
      const currentIdx = PERIOD_IDS.indexOf(current);
      const slotIdx = PERIOD_IDS.indexOf(slot);
      return {
        slot,
        now: slot === current,
        overdue: slotIdx >= 0 && currentIdx > slotIdx,
        status: log?.status || "pending",
        foodName: log?.foodName || "",
      };
    }
  }
  return { done: true };
}

export function nextSugar(readings, meal, now = new Date()) {
  const start = startOfDay(now);
  const today = (readings || []).filter(
    (item) => new Date(item.recordedAt) >= start
  );
  const last = today[0] || null;
  if (!last) {
    return {
      action: "Log a before-food check",
      hint: "No reading yet today",
      last: null,
    };
  }
  if (last.mealTiming === "before") {
    return {
      action: "Log an after-food check",
      hint: `Last was ${last.level} before food`,
      last,
    };
  }
  if (meal?.done) {
    return {
      action: "Checks look done for today",
      hint: `Last was ${last.level} after food`,
      last,
      done: true,
    };
  }
  const nextSlot = meal?.slot ? periodLabel(meal.slot) : "the next meal";
  return {
    action: `Before ${nextSlot.toLowerCase()}`,
    hint: `Last was ${last.level} after food`,
    last,
  };
}

const PERSONALITY_POOL = ["english", "books", "presentation"];

function daySeed(now = new Date()) {
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

export function pickPersonality(items, now = new Date()) {
  const pool = (items || []).filter((item) =>
    PERSONALITY_POOL.includes(item.section)
  );
  if (!pool.length) return null;
  const preferred = pool.filter(
    (item) => item.section !== "books" || item.status !== "read"
  );
  const list = preferred.length ? preferred : pool;
  const seed = daySeed(now);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return list[hash % list.length];
}

export function notebookPath(item) {
  const slug = item.subject?.slug;
  const section = item.section || "theory";
  const parentId = item.parentTopic?._id || item.parent;
  if (!slug || !parentId) return "/learning";
  return `/learning/${slug}/${section}/${parentId}/${item._id}`;
}

export function sessionIsToday(iso, now = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return todayKey(d) === todayKey(now);
}
