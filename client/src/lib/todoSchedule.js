function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function sameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function todoScheduleLabel(todo) {
  const start = validDate(todo?.dueDate);
  if (!start) return "Unscheduled";
  const end = validDate(todo?.endDate);

  if (!end) return `${formatDate(start)} · ${formatTime(start)}`;
  if (sameLocalDay(start, end)) {
    return `${formatDate(start)} · ${formatTime(start)}–${formatTime(end)}`;
  }
  return `${formatDate(start)}, ${formatTime(start)} → ${formatDate(end)}, ${formatTime(end)}`;
}

export function scheduleTimestamp(todo) {
  const start = validDate(todo?.dueDate);
  return start ? start.getTime() : Number.POSITIVE_INFINITY;
}
