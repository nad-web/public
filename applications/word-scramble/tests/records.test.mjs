import test from "node:test";
import assert from "node:assert/strict";
import { defaults, validate, addResult } from "../src/records.js";
import { createStorage } from "../src/storage.js";
const kind = "word",
  modes = kind === "word" ? ["relax", "rush"] : ["classic", "chill"];
const sample = (n = 5, mode = modes[0]) =>
  kind === "word"
    ? {
        mode,
        score: n,
        solved: 1,
        skipped: 0,
        hints: 0,
        seconds: 10,
        date: "2026-11-08",
      }
    : { mode, height: n, score: n * 10, perfect: 0, streak: 0, seconds: 10 };
test("default records validate with sound initially off; malformed values cannot become saved history", () => {
  const r = defaults(kind);
  assert.deepEqual(validate(r, kind), r);
  assert.equal(r.prefs.sound, false);
  for (const mutate of [
    (r) => (r.prefs.sound = "yes"),
    (r) => (r.best[modes[0]] = -1),
    (r) => (r.plays = NaN),
    (r) => (r.recent = Array(9).fill({})),
    (r) => (r.last = { id: "x", done: 5 }),
  ]) {
    const d = defaults(kind);
    mutate(d);
    assert.throws(() => validate(d, kind));
  }
});
test("partial checkpoints count one game and keep best progress; completion is idempotent", () => {
  const r = defaults(kind);
  addResult(r, "a", sample(10), false);
  addResult(r, "a", sample(5), false);
  assert.equal(r.plays, 1);
  assert.equal(r.best[modes[0]], 10);
  assert.equal(r.recent.length, 0);
  assert(addResult(r, "a", sample(11), true, 100));
  assert.equal(addResult(r, "a", sample(99), true, 101), false);
  assert.equal(r.recent.length, 1);
  assert.equal(r.best[modes[0]], 11);
  assert.deepEqual(validate(r, kind), r);
});
test("separate modes keep separate bests and recent results are bounded to eight", () => {
  const r = defaults(kind);
  for (let i = 1; i <= 20; i++)
    addResult(r, "run-" + i, sample(i, i % 2 ? modes[0] : modes[1]), true, i);
  assert.equal(r.plays, 20);
  assert.equal(r.recent.length, 8);
  assert.equal(r.best[modes[0]], 19);
  assert.equal(r.best[modes[1]], 20);
  assert.equal(r.recent[0].id, "run-20");
  assert.throws(() =>
    addResult(r, "bad", { ...sample(), score: Infinity }, false),
  );
});
function backend() {
  const map = new Map([["other-app", "keep"]]);
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}
test("stale writers detect a newer tab rather than replacing its records; other app keys survive", () => {
  const b = backend(),
    a = createStorage(b, "this-app", (r) => validate(r, kind)),
    z = createStorage(b, "this-app", (r) => validate(r, kind));
  a.load();
  z.load();
  const r = defaults(kind);
  assert(a.write(r).ok);
  assert.deepEqual(z.write(r), { ok: false, reason: "conflict" });
  assert.equal(b.map.get("other-app"), "keep");
});
test("unreadable data stays untouched until explicit reset, then only the own key changes", () => {
  const b = backend();
  b.map.set("own", "broken data");
  const s = createStorage(b, "own", (r) => validate(r, kind));
  assert.equal(s.load().error, "invalid");
  assert.equal(s.write(defaults(kind)).reason, "invalid");
  assert.equal(b.map.get("own"), "broken data");
  assert(s.write(defaults(kind), { replaceBroken: true }).ok);
  assert.equal(b.map.get("other-app"), "keep");
});
test("unavailable and full storage are reported instead of claiming durable saving", () => {
  const s = createStorage(undefined, "own", (r) => validate(r, kind));
  s.load();
  assert.equal(s.write(defaults(kind)).reason, "unavailable");
  const b = {
    getItem() {
      return null;
    },
    setItem() {
      throw Error("QuotaExceededError");
    },
  };
  const q = createStorage(b, "own", (r) => validate(r, kind));
  q.load();
  assert.equal(q.write(defaults(kind)).reason, "unavailable");
});
