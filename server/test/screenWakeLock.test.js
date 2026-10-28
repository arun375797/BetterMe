import test from "node:test";
import assert from "node:assert/strict";
import { keepScreenAwake } from "../../client/src/lib/screenWakeLock.js";

const settle = () => new Promise(resolve => setImmediate(resolve));
function setup(request) {
  const document = new EventTarget();
  document.visibilityState = "visible";
  const statuses = [];
  const controller = keepScreenAwake({ navigator: { wakeLock: { request } }, document, onStatus: status => statuses.push(status) });
  return { document, statuses, controller, visible(state) {
    document.visibilityState = state;
    document.dispatchEvent(new Event("visibilitychange"));
  } };
}
function sentinel() {
  const lock = new EventTarget();
  lock.released = false;
  lock.release = async () => { lock.released = true; lock.dispatchEvent(new Event("release")); };
  return lock;
}

test("requests a screen lock and releases it on timer cleanup", async () => {
  const lock = sentinel();
  const env = setup(async type => { assert.equal(type, "screen"); return lock; });
  await settle();
  assert.equal(env.statuses.at(-1), "active");
  env.controller.dispose();
  assert.equal(lock.released, true);
});
test("reacquires the lock when returning from another app or tab", async () => {
  const locks = [];
  const env = setup(async () => { const lock = sentinel(); locks.push(lock); return lock; });
  await settle();
  env.visible("hidden");
  assert.equal(locks[0].released, true);
  env.visible("visible");
  await settle();
  assert.equal(locks.length, 2);
  assert.equal(env.statuses.at(-1), "active");
  env.controller.dispose();
});
test("a late request cannot keep the screen awake after pausing or unmounting", async () => {
  let resolve;
  const lock = sentinel();
  const env = setup(() => new Promise(done => { resolve = done; }));
  env.controller.dispose();
  resolve(lock);
  await settle();
  assert.equal(lock.released, true);
  assert.equal(env.statuses.includes("active"), false);
});
test("a late request is released if the page became hidden", async () => {
  let resolve;
  const lock = sentinel();
  const env = setup(() => new Promise(done => { resolve = done; }));
  env.visible("hidden");
  resolve(lock);
  await settle();
  assert.equal(lock.released, true);
  assert.equal(env.statuses.at(-1), "hidden");
  env.controller.dispose();
});
test("denied requests and system release allow manual retry without a request loop", async () => {
  let calls = 0;
  const lock = sentinel();
  const env = setup(async () => { calls++; if (calls === 1) throw new Error("Battery saver"); return lock; });
  await settle();
  assert.equal(env.statuses.at(-1), "blocked");
  await env.controller.retry();
  assert.equal(env.statuses.at(-1), "active");
  await lock.release();
  assert.equal(env.statuses.at(-1), "released");
  assert.equal(calls, 2);
  env.controller.dispose();
});
test("unsupported browsers fail gracefully", () => {
  const document = new EventTarget();
  document.visibilityState = "visible";
  let status;
  const controller = keepScreenAwake({ navigator: {}, document, onStatus: next => { status = next; } });
  assert.equal(status, "unsupported");
  controller.dispose();
});
test("visibility events and retry cannot create duplicate pending requests", async () => {
  let resolve;
  let calls = 0;
  const env = setup(() => { calls++; return new Promise(done => { resolve = done; }); });
  env.visible("visible");
  env.controller.retry();
  assert.equal(calls, 1);
  resolve(sentinel());
  await settle();
  env.controller.dispose();
  env.visible("visible");
  assert.equal(calls, 1);
});
