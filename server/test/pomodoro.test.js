import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { advance, summarize, clock, dayKey } from "../../client/src/lib/pomodoro.js";
import { validateSession } from "../lib/pomodoro.js";
import router from "../routes/pomodoro.js";
import PomodoroSession from "../models/PomodoroSession.js";
import { requireAuth, createSession } from "../lib/auth.js";

const active = () => ({ plannedMs: 1500000, elapsedMs: 0, pausedMs: 0, updatedAt: 1000, status: "running" });
const valid = () => ({ sessionId: "test-session", day: "2026-10-28", kind: "focus", task: "Task", note: "", startedAt: 1000, endedAt: 1501000, plannedMs: 1500000, elapsedMs: 1500000, pausedMs: 0, distractedMs: 120000 });

test("background throttling and reload recovery cap work at the deadline", () => {
  const restored = JSON.parse(JSON.stringify(active()));
  const result = advance(restored, 3600000);
  assert.equal(result.elapsedMs, 1500000);
  assert.equal(result.endedAt, 1501000);
  assert.equal(result.status, "review");
  assert.deepEqual(advance(result, 7200000), result);
});
test("pause duration is excluded from work and preserved when resuming", () => {
  let row = advance(active(), 61000);
  row = advance({ ...row, status: "paused" }, 181000);
  assert.equal(row.elapsedMs, 60000);
  assert.equal(row.pausedMs, 120000);
  row = advance({ ...row, status: "running" }, 241000);
  assert.equal(row.elapsedMs, 120000);
  assert.equal(row.pausedMs, 120000);
});
test("clock regression cannot create negative time", () => {
  const row = advance(active(), 0);
  assert.equal(row.elapsedMs, 0);
  assert.equal(advance(row, 2000).elapsedMs, 1000);
});
test("focus, distraction, pause and breaks remain separate", () => {
  const rows = [
    { ...valid(), completed: true, pausedMs: 60000 },
    { ...valid(), kind: "break", elapsedMs: 300000, distractedMs: 0, pausedMs: 0, completed: true },
    { ...valid(), elapsedMs: 60000, distractedMs: 30000, pausedMs: 0, completed: false },
  ];
  assert.deepEqual(summarize(rows), { focus: 1410000, distracted: 150000, paused: 60000, break: 300000, completed: 1, attempts: 2 });
});
test("local calendar and countdown formatting", () => {
  assert.equal(dayKey(new Date(2026, 9, 28, 0, 1)), "2026-10-28");
  assert.equal(clock(1500000), "25:00");
  assert.equal(clock(1), "00:01");
  assert.equal(clock(-1), "00:00");
});
test("server derives completion instead of trusting client flags", () => {
  assert.equal(validateSession({ ...valid(), completed: false }).completed, true);
  assert.equal(validateSession({ ...valid(), elapsedMs: 60000, distractedMs: 0, completed: true }).completed, false);
});
test("server rejects impossible durations, dates and unbounded text", () => {
  for (const patch of [
    { distractedMs: 1500001 }, { elapsedMs: -1 }, { elapsedMs: 1500001 },
    { pausedMs: Infinity }, { plannedMs: 0 }, { plannedMs: 181 * 60000 },
    { day: "2026-02-30" }, { endedAt: 0 }, { kind: "break" },
    { task: "a".repeat(201) }, { elapsedMs: "60000" }, { sessionId: "$invalid" },
    { pausedMs: 60000 },
  ]) assert.throws(() => validateSession({ ...valid(), ...patch }), JSON.stringify(patch));
});

test("authenticated API retries preserve one immutable record and invalid input never reaches the database", async () => {
  const records = new Map();
  const originalUpdate = PomodoroSession.findOneAndUpdate;
  const originalFind = PomodoroSession.find;
  let writes = 0;
  PomodoroSession.findOneAndUpdate = async (filter, update, options) => {
    writes += 1;
    assert.equal(options.upsert, true);
    assert.equal(options.runValidators, true);
    if (!records.has(filter.sessionId)) records.set(filter.sessionId, update.$setOnInsert);
    return records.get(filter.sessionId);
  };
  PomodoroSession.find = () => ({ sort: () => ({ lean: async () => [...records.values()] }) });
  const app = express();
  app.use(express.json());
  app.use("/api/pomodoro", requireAuth, router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/pomodoro/sessions`;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${createSession().token}` };
  try {
    assert.equal((await fetch(base)).status, 401);
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/test-session`, { method: "PUT", headers, body: JSON.stringify({ ...valid(), task: i ? "Retry must not overwrite" : "Original" }) });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).task, "Original");
    }
    const invalid = await fetch(`${base}/test-session`, { method: "PUT", headers, body: JSON.stringify({ ...valid(), distractedMs: -1 }) });
    assert.equal(invalid.status, 400);
    const mismatch = await fetch(`${base}/different`, { method: "PUT", headers, body: JSON.stringify(valid()) });
    assert.equal(mismatch.status, 400);
    assert.equal(writes, 2);
    const response = await fetch(base, { headers });
    assert.equal((await response.json()).sessions.length, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
    PomodoroSession.findOneAndUpdate = originalUpdate;
    PomodoroSession.find = originalFind;
  }
});
