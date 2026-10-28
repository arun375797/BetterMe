export function validateSession(body) {
  const { sessionId, day, kind, task = "", note = "", plannedMs, elapsedMs, pausedMs, distractedMs } = body;
  const startedAt = new Date(body.startedAt);
  const endedAt = new Date(body.endedAt);
  if (typeof sessionId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(sessionId)) throw new Error("Invalid session ID.");
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) !== day) throw new Error("Invalid session day.");
  if (!["focus", "break"].includes(kind)) throw new Error("Invalid session type.");
  if (typeof task !== "string" || task.length > 200 || typeof note !== "string" || note.length > 1000) throw new Error("Task or note is too long.");
  if (![plannedMs, elapsedMs, pausedMs, distractedMs].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error("Invalid durations.");
  if (plannedMs < 60000 || plannedMs > 180 * 60000 || elapsedMs > plannedMs || distractedMs > elapsedMs || (kind === "break" && distractedMs !== 0)) throw new Error("Durations are outside the session limits.");
  if (!Number.isFinite(+startedAt) || !Number.isFinite(+endedAt) || endedAt < startedAt || elapsedMs + pausedMs > endedAt - startedAt + 1000) throw new Error("Invalid session timestamps.");
  return { sessionId, day, kind, task: task.trim(), note: note.trim(), plannedMs, elapsedMs, pausedMs, distractedMs, startedAt, endedAt, completed: elapsedMs === plannedMs };
}
