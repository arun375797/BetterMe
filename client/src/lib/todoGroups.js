function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function calendarDay(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return startOfLocalDay(d);
}

export function daysFromToday(dateStr, now = new Date()) {
  const day = calendarDay(dateStr);
  if (!day) return 0;
  return Math.round((day - startOfLocalDay(now)) / 86400000);
}

export function createdGroup(dateStr, now = new Date()) {
  const diff = daysFromToday(dateStr, now);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff > -7 && diff < 0) return "This Week";
  if (diff > -31 && diff < 0) return "This Month";
  return "Older";
}

export function todoListGroup(todo, now = new Date()) {
  if (todo.dueDate) {
    const diff = daysFromToday(todo.dueDate, now);
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return "Upcoming";
  }
  return createdGroup(todo.createdAt, now);
}

export const TODO_GROUP_ORDER = [
  "Overdue",
  "Today",
  "Tomorrow",
  "Upcoming",
  "Yesterday",
  "This Week",
  "This Month",
  "Older",
];

export function groupTodos(todos, now = new Date()) {
  const map = {};
  for (const todo of todos) {
    const g = todoListGroup(todo, now);
    if (!map[g]) map[g] = [];
    map[g].push(todo);
  }
  return TODO_GROUP_ORDER.filter((g) => map[g]).map((g) => ({
    group: g,
    items: map[g],
  }));
}
