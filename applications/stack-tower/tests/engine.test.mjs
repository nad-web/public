import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP,
  MODES,
  createGame,
  startGame,
  pauseGame,
  resumeGame,
  advance,
  drop,
  intersect,
  result,
} from "../src/engine.js";
const game = (mode = "classic") => {
  const g = createGame({ mode, seed: 42 });
  startGame(g);
  return g;
};
function align(g, delta = 0) {
  g.moving[g.moving.axis] = g.blocks.at(-1)[g.moving.axis] + delta;
  g.cooldown = 0;
}
test("seeded movement is reproducible, starts in ready state and alternates axes", () => {
  const a = createGame({ seed: 42 }),
    b = createGame({ seed: 42 });
  assert.deepEqual(a, b);
  advance(a, 1);
  assert.equal(a.elapsed, 0);
  startGame(a);
  align(a);
  assert.equal(a.moving.axis, "x");
  drop(a);
  assert.equal(a.moving.axis, "z");
  align(a);
  drop(a);
  assert.equal(a.moving.axis, "x");
  assert.throws(() => createGame({ mode: "other" }));
});
test("full overlap makes a perfect drop and preserves dimensions on both axes", () => {
  const g = game();
  for (let i = 0; i < 10; i++) {
    align(g, MODES.classic.tolerance);
    const e = drop(g);
    assert.equal(e.type, "perfect");
    assert.equal(g.blocks.at(-1).w, 150);
    assert.equal(g.blocks.at(-1).d, 150);
  }
  assert.equal(g.perfect, 10);
  assert.equal(g.height, 10);
  assert.equal(g.bestStreak, 10);
});
test("every third consecutive perfect awards the documented bonus", () => {
  const g = game();
  for (let i = 0; i < 3; i++) {
    align(g);
    drop(g);
  }
  assert.equal(g.score, 55);
  assert.equal(g.streak, 3);
  assert.equal(g.lastPoints, 25);
  align(g, 30);
  drop(g);
  assert.equal(g.streak, 0);
  assert.equal(g.score, 65);
});
test("positive and negative overhangs are trimmed exactly and the cut complements the placed footprint", () => {
  for (const axis of ["x", "z"])
    for (const delta of [-90, -10, 10, 90]) {
      const b = { x: 0, z: 0, w: 150, d: 150, y: 0, h: 24 },
        m = { ...b, axis, [axis]: delta, y: 24 },
        r = intersect(b, m, 4),
        size = axis === "x" ? "w" : "d";
      assert.equal(r.placed[size], 150 - Math.abs(delta));
      assert.equal(r.cut[size], Math.abs(delta));
      assert.equal(r.cut[size] + r.placed[size], m[size]);
      assert.equal(r.placed[axis], delta / 2);
      assert.equal(
        r.placed[axis] +
          Math.sign(delta) * (r.placed[size] / 2 + r.cut[size] / 2),
        r.cut[axis],
      );
    }
});
test("zero and sub-unit overlap ends the run; an ended run cannot place or grow", () => {
  for (const delta of [150, -150, 180, -180, 149.5]) {
    const g = game();
    align(g, delta);
    assert.equal(drop(g).type, "miss");
    assert.equal(g.phase, "ended");
    const score = g.score,
      height = g.height;
    assert.equal(drop(g), null);
    advance(g, 1);
    assert.equal(g.height, height);
    assert.equal(g.score, score);
    assert.equal(g.moving, null);
  }
});
test("a valid small overlap remains playable with a narrowed next block", () => {
  const g = game();
  align(g, 148);
  assert.equal(drop(g).type, "placed");
  assert.equal(g.blocks.at(-1).w, 2);
  assert.equal(g.moving.w, 2);
  assert.equal(g.height, 1);
});
test("a press places one block; the short cooldown rejects accidental double activations", () => {
  const g = game();
  align(g);
  assert(drop(g));
  assert.equal(drop(g), null);
  assert.equal(g.height, 1);
  for (let i = 0; i < 20; i++) advance(g, STEP);
  assert.equal(g.cooldown, 0);
});
test("pause/resume preserves the moving block, freezes time and adds a resume guard", () => {
  const g = game();
  advance(g, 0.1);
  const old = structuredClone(g.moving),
    elapsed = g.elapsed;
  assert(pauseGame(g));
  advance(g, 0.1);
  assert.deepEqual(g.moving, old);
  assert.equal(g.elapsed, elapsed);
  assert.equal(drop(g), null);
  assert(resumeGame(g));
  assert.equal(drop(g), null);
  advance(g, 0.1);
  assert.notDeepEqual(g.moving, old);
});
test("fixed steps make movement independent of frame partitioning and remain bounded across bounces", () => {
  const a = game(),
    b = game();
  for (let i = 0; i < 1200; i++) advance(a, STEP);
  for (let i = 0; i < 100; i++) advance(b, 0.1);
  assert(Math.abs(a.moving.x - b.moving.x) < 1e-7);
  assert(Math.abs(a.elapsed - b.elapsed) < 1e-7);
  for (let i = 0; i < 5000; i++) {
    advance(a, STEP);
    assert(Math.abs(a.moving[a.moving.axis] - a.moving.origin) <= 185 + 1e-8);
  }
});
test("Chill is slower with wider perfect tolerance, keeping best metrics mode-specific", () => {
  const a = game(),
    b = game("chill");
  advance(a, 0.1);
  advance(b, 0.1);
  assert(
    Math.abs(a.moving.x - a.moving.origin) <
      Math.abs(b.moving.x - b.moving.origin),
  );
  align(a, 6);
  align(b, 6);
  assert.equal(drop(a).type, "placed");
  assert.equal(drop(b).type, "perfect");
  assert.equal(result(b).mode, "chill");
});
test("render history and falling effects are bounded while true tower height keeps growing", () => {
  const g = game();
  for (let i = 0; i < 1000; i++) {
    align(g);
    drop(g);
  }
  assert.equal(g.height, 1000);
  assert.equal(g.blocks.length, 24);
  assert.equal(g.blocks.at(-1).y, 24000);
  align(g, 10);
  drop(g);
  assert.equal(g.falling.length, 1);
  for (let i = 0; i < 180; i++) advance(g, STEP);
  assert.equal(g.falling.length, 0);
});
test("invalid frame values are ignored and large time gaps are clamped", () => {
  const g = game();
  for (const dt of [NaN, Infinity, -1, 0]) advance(g, dt);
  assert.equal(g.elapsed, 0);
  advance(g, 999);
  assert(g.elapsed <= 0.12 + 1e-9);
});
test("perfect tolerance narrows with tiny blocks and cannot rescue a complete miss", () => {
  const base = { x: 0, z: 0, w: 2, d: 2, y: 0, h: 24 };
  for (const axis of ["x", "z"]) {
    assert.equal(intersect(base, { ...base, axis, [axis]: 3 }, 8).placed, null);
    assert.equal(
      intersect(base, { ...base, axis, [axis]: 0.2 }, 8).perfect,
      true,
    );
    const trimmed = intersect(base, { ...base, axis, [axis]: 0.5 }, 8);
    assert.equal(trimmed.perfect, false);
    assert.equal(trimmed.placed[axis === "x" ? "w" : "d"], 1.5);
  }
});
