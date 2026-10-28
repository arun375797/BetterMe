export const defaults = { focus: 25, break: 5, goal: 4 };
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function clock(ms) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function duration(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}
// Advance from timestamps, never from the number of interval callbacks received.
export function advance(session, now = Date.now()) {
  if (!session || session.status === "review") return session;
  now = Math.max(now, session.updatedAt);
  const delta = Math.max(0, now - session.updatedAt);
  if (session.status === "paused") return { ...session, pausedMs: session.pausedMs + delta, updatedAt: now };
  const used = Math.min(delta, session.plannedMs - session.elapsedMs);
  const elapsedMs = session.elapsedMs + used;
  const done = elapsedMs >= session.plannedMs;
  return { ...session, elapsedMs, updatedAt: now, status: done ? "review" : "running", endedAt: done ? session.updatedAt + used : null };
}
export function summarize(sessions) {
  return sessions.reduce((sum, row) => {
    if (row.kind === "focus") {
      sum.focus += row.elapsedMs - row.distractedMs;
      sum.distracted += row.distractedMs;
      sum.completed += Number(row.completed);
      sum.attempts += 1;
    } else sum.break += row.elapsedMs;
    sum.paused += row.pausedMs;
    return sum;
  }, { focus: 0, distracted: 0, paused: 0, break: 0, completed: 0, attempts: 0 });
}
