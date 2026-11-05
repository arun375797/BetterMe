import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import router from "../routes/subjects.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import StudyGoal from "../models/StudyGoal.js";
import PlanItem from "../models/PlanItem.js";
import StudyLog from "../models/StudyLog.js";
import StudySettings from "../models/StudySettings.js";
import { requireAuth, createSession } from "../lib/auth.js";
import { memoGet } from "../memo.js";

test("deleting a language scopes all related records, cleans study settings, and clears cached navigation", async () => {
  const originals = [];
  function stub(model, method, fn) {
    originals.push(() => { model[method] = original; });
    const original = model[method];
    model[method] = fn;
  }
  let active = false;
  let transactions = 0;
  let ended = 0;
  let fail = false;
  const writes = [];
  const session = {
    async withTransaction(fn) { transactions++; active = true; try { await fn(); } finally { active = false; } },
    async endSession() { ended++; },
  };
  const query = (value) => ({ session(s) { assert.equal(s, session); assert.equal(active, true); return Promise.resolve(value); } });
  stub(Subject, "startSession", async () => session);
  stub(Subject, "findOne", ({ slug }) => query(slug === "python" ? { _id: "py", slug } : null));
  stub(Topic, "find", (filter) => ({ select: () => ({ session(s) {
    assert.equal(s, session);
    assert.deepEqual(filter, { subject: "py" });
    return { lean: async () => [{ _id: "theory-topic" }, { _id: "practical-topic" }] };
  } }) }));
  for (const [model, method] of [[Question, "deleteMany"], [Question, "updateMany"], [Topic, "deleteMany"],
    [StudyGoal, "deleteMany"], [PlanItem, "deleteMany"], [StudyLog, "deleteMany"], [Subject, "deleteOne"]]) {
    stub(model, method, (...args) => ({ async session(s) {
      assert.equal(s, session);
      assert.equal(active, true);
      if (fail && model === PlanItem) throw new Error("Database failure");
      writes.push({ model: model.modelName, method, args });
      return { deletedCount: 1 };
    } }));
  }
  const settings = {
    rotation: [{ weekday: 1, subjects: ["py", "js"], subject: "py" }],
    focus: { "py:theory": "theory-topic", "py:practical": "practical-topic", "js:theory": "other-topic" },
    markModified(key) { assert.equal(key, "focus"); },
    async save({ session: s }) { assert.equal(s, session); },
  };
  stub(StudySettings, "findOne", () => query(settings));
  const app = express();
  app.use("/api/learning", requireAuth, router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/learning/subjects`;
  const headers = { Authorization: `Bearer ${createSession().token}` };
  const remove = (slug) => fetch(`${url}/${slug}`, { method: "DELETE", headers });
  try {
    assert.equal((await fetch(`${url}/python`, { method: "DELETE" })).status, 401);
    assert.equal(transactions, 0);
    assert.equal((await remove("missing")).status, 404);
    assert.equal(writes.length, 0);
    await memoGet("learning:subjects", 20_000, async () => "stale");
    assert.equal((await remove("python")).status, 200);
    assert.equal(writes.length, 7);
    assert.deepEqual(writes[0].args[0], { topic: { $in: ["theory-topic", "practical-topic"] } });
    assert.deepEqual(writes[1].args, [{ relatedSection: { $in: ["theory-topic", "practical-topic"] } }, { $set: { relatedSection: null } }]);
    for (const write of writes.slice(2, -1)) assert.deepEqual(write.args[0], { subject: "py" });
    assert.deepEqual(writes.at(-1).args[0], { _id: "py" });
    assert.deepEqual(settings.rotation[0], { weekday: 1, subjects: ["js"], subject: null });
    assert.deepEqual(settings.focus, { "js:theory": "other-topic" });
    assert.equal(settings.subjectsInitialized, true);
    assert.equal(await memoGet("learning:subjects", 20_000, async () => "fresh"), "fresh");
    writes.length = 0;
    fail = true;
    assert.equal((await remove("python")).status, 500);
    assert.equal(writes.some((write) => write.model === "Subject"), false);
    assert.equal(ended, 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    for (const restore of originals.reverse()) restore();
  }
});
