import test from "node:test";
import assert from "node:assert/strict";
import { defaults, validateRecord, recordRun } from "../src/records.js";
import { createStorage } from "../src/storage.js";
const result = {
  mode: "classic",
  score: 30,
  meters: 20,
  seconds: 2,
  jumps: 2,
  cleared: 2,
  ducked: 0,
  done: false,
  reason: null,
};
test("new records validate and start with sound off", () => {
  const r = defaults();
  assert.deepEqual(validateRecord(r), r);
  assert.equal(r.prefs.sound, false);
  assert.equal(r.best.classic, 0);
});
test("periodic snapshots add only positive deltas and count each started run once", () => {
  const r = defaults();
  recordRun(r, "a", result);
  recordRun(r, "a", result);
  assert.equal(r.stats.runs, 1);
  assert.equal(r.stats.meters, 20);
  recordRun(r, "a", { ...result, score: 60, meters: 40, jumps: 3 });
  assert.equal(r.stats.meters, 40);
  assert.equal(r.stats.jumps, 3);
  recordRun(r, "a", result);
  assert.equal(r.stats.meters, 40);
  assert.equal(r.best.classic, 60);
});
test("a finished run enters recent history once and separate modes keep separate bests", () => {
  const r = defaults(),
    end = { ...result, done: true, reason: "collision" };
  recordRun(r, "a", end, 1000);
  assert.equal(recordRun(r, "a", end, 1000), false);
  assert.equal(r.recent.length, 1);
  recordRun(r, "b", { ...end, mode: "chill", score: 100 }, 2000);
  assert.equal(r.best.chill, 100);
  assert.equal(r.best.classic, 30);
  assert.equal(r.stats.runs, 2);
  assert.doesNotThrow(() => validateRecord(r));
});
test("recent runs are bounded while aggregate records survive", () => {
  const r = defaults();
  for (let i = 0; i < 15; i++)
    recordRun(r, "run-" + i, { ...result, done: true, reason: "collision" }, i);
  assert.equal(r.recent.length, 10);
  assert.equal(r.stats.runs, 15);
  assert.equal(r.stats.meters, 300);
  assert.doesNotThrow(() => validateRecord(r));
});
test("malformed saved records and invalid snapshot values are rejected", () => {
  for (const mutate of [
    (r) => (r.best.classic = -1),
    (r) => (r.stats.meters = Infinity),
    (r) => (r.prefs.skin = "unknown"),
    (r) => (r.prefs.sound = "yes"),
    (r) => (r.recent = [{ id: "bad" }]),
    (r) => (r.lastRun = { id: "invalid" }),
  ]) {
    const r = defaults();
    mutate(r);
    assert.throws(() => validateRecord(r));
  }
  const r = defaults();
  assert.equal(recordRun(r, "a", { ...result, score: NaN }), false);
  assert.equal(
    recordRun(r, "a", { ...result, done: true, reason: "invalid" }),
    false,
  );
  assert.deepEqual(r, defaults());
});
function backend() {
  const map = new Map();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}
test("score writes and reset touch only this app's key", () => {
  const b = backend();
  b.map.set("sankey", "keep");
  b.map.set("rooftop-cat", "keep");
  const s = createStorage(b, "dino", validateRecord);
  s.load();
  assert(s.write(defaults()).ok);
  assert(s.write(defaults(), { replaceBroken: true }).ok);
  assert.equal(b.map.get("sankey"), "keep");
  assert.equal(b.map.get("rooftop-cat"), "keep");
});
test("stale tabs cannot silently overwrite a newer game record", () => {
  const b = backend(),
    a = createStorage(b, "dino", validateRecord),
    other = createStorage(b, "dino", validateRecord);
  a.load();
  other.load();
  const r = defaults();
  r.best.classic = 100;
  a.write(r);
  assert.equal(other.write(defaults()).reason, "conflict");
  assert.equal(JSON.parse(b.map.get("dino")).best.classic, 100);
});
test("unreadable records are preserved until explicit reset", () => {
  const b = backend();
  b.map.set("dino", "broken");
  const s = createStorage(b, "dino", validateRecord);
  assert.equal(s.load().error, "invalid");
  assert.equal(s.write(defaults()).reason, "invalid");
  assert.equal(b.map.get("dino"), "broken");
  assert(s.write(defaults(), { replaceBroken: true }).ok);
  assert.equal(s.broken, false);
});
test("denied or full storage does not pretend that scores were saved", () => {
  for (const b of [
    {
      getItem() {
        throw Error("denied");
      },
      setItem() {},
    },
    {
      getItem: () => null,
      setItem() {
        throw Error("full");
      },
    },
  ]) {
    const s = createStorage(b, "dino", validateRecord);
    s.load();
    assert.equal(s.write(defaults()).reason, "unavailable");
  }
});
