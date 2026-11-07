import test from "node:test";
import assert from "node:assert/strict";
import { createStorage } from "../src/storage.js";
import { initialState, validateState } from "../src/engine.js";
import { CHALLENGES } from "../src/challenges.js";
import { challengeSVG, challengeText } from "../src/share.js";
const valid = (s) => validateState(s, CHALLENGES);
function backend() {
  const map = new Map();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}
test("records are scoped to a single key and leave other applications unchanged", () => {
  const b = backend();
  b.map.set("sankey-diagram", "keep");
  b.map.set("rooftop-cat", "keep");
  const r = createStorage(b, "boredom", valid);
  r.load();
  assert(r.write(initialState()).ok);
  assert.equal(b.map.get("sankey-diagram"), "keep");
  assert.equal(b.map.get("rooftop-cat"), "keep");
});
test("a stale tab cannot overwrite a newer saved record", () => {
  const b = backend(),
    a = createStorage(b, "x", valid),
    other = createStorage(b, "x", valid);
  a.load();
  other.load();
  const next = initialState();
  next.settings.theme = "dark";
  assert(a.write(next).ok);
  assert.deepEqual(other.write(initialState()), {
    ok: false,
    reason: "conflict",
  });
  assert.equal(JSON.parse(b.map.get("x")).settings.theme, "dark");
  assert.equal(other.load().state.settings.theme, "dark");
});
test("denied and full storage report a failure without pretending that data was saved", () => {
  const denied = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
  const r = createStorage(denied, "x", valid);
  assert.equal(r.load().error, "unavailable");
  assert.equal(r.write(initialState()).reason, "unavailable");
  const full = {
    getItem: () => null,
    setItem() {
      throw Error("quota");
    },
  };
  const q = createStorage(full, "x", valid);
  q.load();
  assert.equal(q.write(initialState()).ok, false);
  assert.equal(q.raw, null);
});
test("an unreadable record is preserved until an explicit reset or import", () => {
  const b = backend();
  b.map.set("x", "not json");
  const r = createStorage(b, "x", valid);
  assert.equal(r.load().error, "invalid");
  assert.equal(r.broken, true);
  assert.equal(r.write(initialState()).reason, "invalid");
  assert.equal(b.map.get("x"), "not json");
  assert(r.write(initialState(), { replaceBroken: true }).ok);
  assert.equal(r.broken, false);
});
test("external removal clears the invalid-record guard for a fresh record", () => {
  const b = backend();
  b.map.set("x", "invalid");
  const r = createStorage(b, "x", valid);
  r.load();
  b.map.delete("x");
  assert.equal(r.load().state, null);
  assert(r.write(initialState()).ok);
});
test("download cards escape custom text and contain the author credit", () => {
  const c = {
    ...CHALLENGES[0],
    title: '<script>alert("x")</script> & "hello"',
    materials: "Paper & pen",
    steps: ["<image href='https://bad.test'/> & enjoy"],
  };
  const svg = challengeSVG(c);
  assert(!svg.includes("<script>"));
  assert(!svg.includes("<image href="));
  assert(svg.includes("&lt;"));
  assert(svg.includes("&amp;"));
  assert(svg.includes("Noorullah Adel"));
  assert(challengeText(c).includes("2026"));
});
test("long words wrap into the share card and its height grows for long content", () => {
  const c = {
    ...CHALLENGES[0],
    title: "W".repeat(72),
    steps: Array(3).fill("W".repeat(190)),
  };
  const svg = challengeSVG(c);
  assert(svg.match(/<text /g).length > 20);
  assert(Number(svg.match(/height="([\d.]+)"/)[1]) > 740);
  assert(!svg.includes("W".repeat(72)));
});
