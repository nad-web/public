import test from "node:test";
import assert from "node:assert/strict";
import {
  MODES,
  STEP,
  PLAYER_X,
  createGame,
  startGame,
  pauseGame,
  resumeGame,
  requestJump,
  releaseJump,
  setDucking,
  advance,
  playerBoxes,
  overlaps,
  snapshot,
  goals,
} from "../src/engine.js";
import { nightMode } from "../src/render.js";
function seconds(g, n) {
  const events = [];
  for (let i = 0; i < Math.round(n / STEP) && g.phase === "running"; i++)
    events.push(...advance(g, STEP));
  return events;
}
function empty(mode = "classic") {
  const g = createGame({ mode });
  g.obstacles = [];
  g.nextAt = Infinity;
  startGame(g);
  return g;
}
function obstacle(type = "cactus-small", x = PLAYER_X + 15) {
  return {
    id: 90,
    type,
    x,
    width: type.startsWith("flyer") ? 46 : 22,
    height: type.startsWith("flyer") ? 23 : 36,
    bottom: type === "flyer-low" ? 33 : type === "flyer-high" ? 88 : 0,
    hit: false,
    passed: false,
    ducked: false,
  };
}
test("seeded obstacle routes are reproducible, varied and independent of viewport", () => {
  const a = createGame({ seed: "same" }),
    b = createGame({ seed: "same" }),
    c = createGame({ seed: "different" });
  assert.deepEqual(a.obstacles, b.obstacles);
  assert.notDeepEqual(a.obstacles, c.obstacles);
  assert(a.obstacles[0].x - PLAYER_X >= 680);
  assert.throws(() => createGame({ mode: "invalid" }));
});
test("ready/paused games do not advance; resume preserves the in-air position and velocity", () => {
  const g = createGame();
  advance(g, 0.1);
  assert.equal(g.elapsed, 0);
  startGame(g);
  requestJump(g);
  seconds(g, 0.1);
  const before = { ...g.player };
  assert(pauseGame(g));
  releaseJump(g);
  advance(g, 0.1);
  assert.deepEqual(g.player, before);
  assert(resumeGame(g));
  advance(g, STEP);
  assert(g.player.y > before.y);
});
test("fixed steps produce the same physics for different frame partitions", () => {
  const a = empty(),
    b = empty();
  requestJump(a);
  requestJump(b);
  for (let i = 0; i < 10; i++) advance(a, 0.1);
  for (let i = 0; i < 120; i++) advance(b, STEP);
  assert(Math.abs(a.distance - b.distance) < 1e-8);
  assert(Math.abs(a.player.y - b.player.y) < 1e-8);
  assert.equal(a.score, b.score);
});
test("held jumps are higher than taps and cannot become double jumps", () => {
  const hold = empty(),
    tap = empty();
  requestJump(hold);
  requestJump(tap);
  releaseJump(tap);
  let high = 0,
    low = 0;
  for (let i = 0; i < 100; i++) {
    advance(hold, STEP);
    advance(tap, STEP);
    high = Math.max(high, hold.player.y);
    low = Math.max(low, tap.player.y);
  }
  assert(high > 100 && high < 115);
  assert(low > 60 && low < 75);
  assert(high > low);
  assert.equal(hold.jumps, 1);
  assert(!requestJump(hold));
  releaseJump(hold);
  requestJump(hold);
  advance(hold, STEP);
  assert.equal(hold.jumps, 2);
});
test("mid-air presses expire rather than giving an extra jump; a near-landing press is buffered", () => {
  const g = empty();
  requestJump(g);
  seconds(g, 0.16);
  releaseJump(g);
  requestJump(g);
  releaseJump(g);
  seconds(g, 0.16);
  assert.equal(g.jumps, 1);
  seconds(g, 0.3);
  assert.equal(g.jumps, 1);
  while (g.player.y > 10) advance(g, STEP);
  requestJump(g);
  let sawSecond = false;
  for (let i = 0; i < 30; i++) {
    advance(g, STEP);
    if (g.jumps === 2) sawSecond = true;
  }
  assert(sawSecond);
});
test("ducking lowers the body; a held Down input accelerates descent", () => {
  const g = empty();
  const standing = playerBoxes(g);
  setDucking(g, true);
  advance(g, STEP);
  assert(g.player.duck);
  assert(Math.max(...playerBoxes(g).map((b) => b.y + b.height)) < 30);
  assert(Math.max(...standing.map((b) => b.y + b.height)) > 50);
  setDucking(g, false);
  requestJump(g);
  seconds(g, 0.15);
  const normal = structuredClone(g);
  setDucking(g, true);
  seconds(g, 0.1);
  seconds(normal, 0.1);
  assert(g.player.y < normal.player.y);
});
test("a low flyer hits a standing dinosaur and passes over a crouching one", () => {
  const stand = empty(),
    duck = empty();
  stand.obstacles = [obstacle("flyer-low")];
  duck.obstacles = [obstacle("flyer-low")];
  setDucking(duck, true);
  seconds(stand, 0.4);
  seconds(duck, 0.4);
  assert.equal(stand.phase, "ended");
  assert.equal(duck.phase, "running");
  assert.equal(duck.cleared, 1);
  assert.equal(duck.ducked, 1);
});
test("a high flyer can be safely passed without a jump", () => {
  const g = empty();
  g.obstacles = [obstacle("flyer-high")];
  seconds(g, 0.4);
  assert.equal(g.phase, "running");
  assert.equal(g.cleared, 1);
  assert.equal(g.ducked, 0);
});
test("classic collision ends once; ended games cannot move or accept a jump", () => {
  const g = empty();
  g.obstacles = [obstacle()];
  const events = advance(g, STEP);
  assert.equal(g.lives, 0);
  assert.equal(g.phase, "ended");
  assert.equal(events.filter((e) => e.type === "end").length, 1);
  const distance = g.distance;
  assert.deepEqual(advance(g, 0.1), []);
  assert.equal(g.distance, distance);
  assert(!requestJump(g));
  assert(!resumeGame(g));
});
test("Chill grants three hearts, one hit per obstacle, and no clean-pass credit for a collision", () => {
  const g = empty("chill");
  g.obstacles = [obstacle()];
  advance(g, STEP);
  assert.equal(g.lives, 2);
  assert(g.invulnerable > 1);
  seconds(g, 0.4);
  assert.equal(g.lives, 2);
  assert.equal(g.cleared, 0);
  g.obstacles.push(obstacle("cactus-small", g.distance + PLAYER_X + 15));
  advance(g, STEP);
  assert.equal(g.lives, 2);
  assert(g.obstacles.at(-1).hit);
});
test("exactly touching collision edges is safe and real overlap is detected", () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  assert(!overlaps(a, { x: 10, y: 0, width: 10, height: 10 }));
  assert(overlaps(a, { x: 9, y: 0, width: 10, height: 10 }));
});
test("sprint finishes after sixty active seconds, pauses do not consume that time", () => {
  const g = empty("sprint");
  seconds(g, 20);
  pauseGame(g);
  advance(g, 0.1);
  assert(Math.abs(g.elapsed - 20) < 1e-6);
  resumeGame(g);
  const events = seconds(g, 40);
  assert.equal(g.phase, "ended");
  assert.equal(g.reason, "finished");
  assert.equal(snapshot(g).seconds, 60);
  assert.equal(events.filter((e) => e.type === "end").length, 1);
});
test("score is distance plus five per clean pass and milestones do not repeat", () => {
  const g = empty();
  g.obstacles = [obstacle("flyer-high")];
  const events = seconds(g, 4);
  assert.equal(g.score, Math.floor(g.distance / 10) + 5);
  const milestones = events
    .filter((e) => e.type === "milestone")
    .map((e) => e.score);
  assert.deepEqual(milestones, [100]);
  assert.equal(goals(g)[0].value, 1);
});
test("invalid frame durations are ignored and large gaps are bounded", () => {
  const g = empty();
  for (const dt of [NaN, Infinity, -1, 0]) advance(g, dt);
  assert.equal(g.elapsed, 0);
  advance(g, 1000);
  assert(g.elapsed <= 0.120001);
  assert(g.distance < 100);
});
test("day/night changes stay still when effects or reduced motion are requested", () => {
  const g = createGame(),
    p = { theme: "auto", effects: true };
  g.distance = 3100;
  assert.equal(nightMode(g, p), true);
  assert.equal(nightMode(g, p, true), false);
  assert.equal(nightMode(g, { ...p, effects: false }), false);
  assert.equal(nightMode(g, { theme: "night", effects: false }, true), true);
  assert.equal(nightMode(g, { theme: "paper", effects: true }), false);
});
test("generated routes are traversable with correctly timed jumps and ducks across modes and seeds", () => {
  for (const mode of Object.keys(MODES))
    for (let seed = 0; seed < 5; seed++) {
      const g = createGame({ mode, seed: "route-" + seed });
      startGame(g);
      let jumpAt = -10,
        maxObjects = 0;
      for (let i = 0; i < 120 * 60 && g.phase === "running"; i++) {
        const next = g.obstacles.find(
          (o) => !o.passed && o.x + o.width > g.distance + PLAYER_X + 6,
        );
        const edge = next ? next.x - g.distance - PLAYER_X : Infinity;
        setDucking(g, next?.type === "flyer-low" && edge < 145);
        if (
          next &&
          !next.type.startsWith("flyer") &&
          g.player.y === 0 &&
          edge < g.speed * 0.28 + 55
        ) {
          releaseJump(g);
          requestJump(g);
          jumpAt = g.elapsed;
        }
        if (g.elapsed - jumpAt > 0.4) releaseJump(g);
        advance(g, STEP);
        maxObjects = Math.max(maxObjects, g.obstacles.length);
      }
      assert.notEqual(
        g.reason,
        "collision",
        `${mode} seed ${seed} had an impossible or mistimed route`,
      );
      assert.equal(g.lives, MODES[mode].lives);
      assert(g.cleared > 15);
      assert(maxObjects < 15);
      if (mode === "sprint") assert.equal(g.reason, "finished");
    }
});
