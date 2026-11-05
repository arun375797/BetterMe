import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import router from "../routes/subjects.js";
import Subject from "../models/Subject.js";
import { requireAuth, createSession } from "../lib/auth.js";
import { memoGet } from "../memo.js";

test("creating learning subjects validates input, preserves distinct language names, and clears cached navigation", async () => {
  const originalFind = Subject.findOne;
  const originalCreate = Subject.create;
  const records = [{ name: "JavaScript", slug: "js", shortName: "JS", order: 5 }];
  let writes = 0;
  Subject.findOne = (filter) => {
    if (!filter) return { sort: () => ({ lean: async () => records.at(-1) }) };
    return Promise.resolve(records.find((item) => Object.entries(filter).every(([key, value]) =>
      value instanceof RegExp ? value.test(item[key]) : item[key] === value
    )) || null);
  };
  Subject.create = async (data) => { writes++; records.push(data); return data; };
  const app = express();
  app.use(express.json());
  app.use("/api/learning", requireAuth, router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/learning/subjects`;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${createSession().token}` };
  const post = (data) => fetch(url, { method: "POST", headers, body: JSON.stringify(data) });
  try {
    assert.equal((await fetch(url, { method: "POST" })).status, 401);
    for (const data of [{}, { name: " " }, { name: {} }, { name: "a".repeat(81) },
      { name: "Python", shortName: "x".repeat(25) }, { name: "Python", accent: "invalid" },
      { name: "Python", description: {} }]) {
      assert.equal((await post(data)).status, 400);
    }
    assert.equal(writes, 0);
    await memoGet("learning:subjects", 20_000, async () => "old navigation");
    const response = await post({ name: " Python ", shortName: "Py", accent: "gold" });
    assert.equal(response.status, 201);
    const python = await response.json();
    assert.equal(python.name, "Python");
    assert.equal(python.shortName, "Py");
    assert.equal(python.slug, "python");
    assert.equal(python.order, 6);
    assert.equal(await memoGet("learning:subjects", 20_000, async () => "fresh navigation"), "fresh navigation");
    assert.equal((await post({ name: "python" })).status, 409);
    for (const [name, slug] of [["C", "c"], ["C++", "c-plus-plus"], ["C#", "c-sharp"]]) {
      const result = await post({ name });
      assert.equal(result.status, 201);
      const body = await result.json();
      assert.equal(body.slug, slug);
      assert.equal(body.shortName, name);
    }
    const plan = await (await post({ name: "Plan" })).json();
    assert.match(plan.slug, /^plan-.+/);
    const collision = await (await post({ name: "C sharp" })).json();
    assert.match(collision.slug, /^c-sharp-.+/);
    Subject.create = async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); };
    assert.equal((await post({ name: "Ruby" })).status, 409);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    Subject.findOne = originalFind;
    Subject.create = originalCreate;
  }
});
