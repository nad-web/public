import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  startGame,
  pauseGame,
  tick,
  ensureWorld,
  dateKey,
  STEP,
  MODES,
  missions,
} from "../src/engine.js";
const advance = (g, s, input = () => ({})) => {
  const events = [];
  for (let i = 0; i < Math.round(s / STEP); i++)
    events.push(...tick(g, STEP, input(g, i)));
  return events;
};
test("all modes produce reproducible courses with bounded gaps, rises and landing widths", () => {
  for (const mode of Object.keys(MODES))
    for (let seed = 0; seed < 30; seed++) {
      const a = createGame({ mode, seed: String(seed), date: "2026-11-07" }),
        b = createGame({ mode, seed: String(seed), date: "2026-11-07" });
      assert.deepEqual(a.roofs, b.roofs);
      assert.deepEqual(a.fish, b.fish);
      assert.deepEqual(a.hazards, b.hazards);
      for (let i = 1; i < a.roofs.length; i++) {
        const l = a.roofs[i - 1],
          r = a.roofs[i],
          gap = r.x - l.x - l.w;
        assert(
          gap >= MODES[mode].gap[0] - 0.001 &&
            gap <= MODES[mode].gap[1] + 0.001,
        );
        assert(Math.abs(r.y - l.y) <= 29.01);
        assert(r.w >= 265);
      }
    }
});
test("daily courses depend on local date and not an arbitrary session seed", () => {
  assert.deepEqual(
    createGame({ mode: "daily", seed: "a", date: "2026-11-07" }).roofs,
    createGame({ mode: "daily", seed: "b", date: "2026-11-07" }).roofs,
  );
  assert.notDeepEqual(
    createGame({ mode: "daily", date: "2026-11-07" }).roofs,
    createGame({ mode: "daily", date: "2026-11-08" }).roofs,
  );
  assert.equal(dateKey(new Date(2026, 0, 2, 0, 3)), "2026-01-02");
});
test("two airborne jumps are allowed, a third cannot reset velocity", () => {
  const g = createGame();
  startGame(g);
  assert.equal(tick(g, STEP, { jump: true })[0].second, false);
  advance(g, 0.18);
  assert.equal(tick(g, STEP, { jump: true })[0].second, true);
  advance(g, 0.18);
  const before = g.player.vy;
  assert(!tick(g, STEP, { jump: true }).some((e) => e.type === "jump"));
  assert(g.player.vy > before);
  assert.equal(g.player.jumps, 2);
});
test("the widest uphill gap in every mode has a reachable double-jump trajectory", () => {
  for (const mode of Object.keys(MODES)) {
    const g = createGame({ mode });
    g.roofs = [
      { id: 0, x: 0, y: 390, w: 400, style: 0 },
      { id: 1, x: 400 + MODES[mode].gap[1], y: 361, w: 360, style: 0 },
    ];
    g.hazards = [];
    g.fish = [];
    g.lastSafe = g.roofs[0];
    g.player.x = 350;
    g.player.y = 352;
    startGame(g);
    let landed = false;
    for (let i = 0; i < 180; i++) {
      tick(g, STEP, { jump: i === 0 || i === 37 });
      if (g.lastSafe.id === 1 && g.player.grounded) {
        landed = true;
        break;
      }
    }
    assert(landed, mode);
    assert.equal(g.lives, 3);
  }
});
test("walk-off grace and a buffered landing press are forgiving without granting extra air jumps", () => {
  const g = createGame();
  startGame(g);
  g.player.x = g.roofs[0].w - 4;
  advance(g, 0.04);
  assert(!g.player.grounded);
  assert(tick(g, STEP, { jump: true }).some((e) => e.type === "jump"));
  g.player = {
    x: 150,
    y: g.roofs[0].y - 39,
    w: 38,
    h: 38,
    vy: 100,
    grounded: false,
    jumps: 2,
  };
  g.coyote = 0;
  g.jumpCooldown = 0;
  tick(g, STEP, { jump: true });
  assert(advance(g, 0.03).some((e) => e.type === "jump"));
});
test("fish count once and quick catches produce an exact capped multiplier", () => {
  const g = createGame();
  startGame(g);
  g.fish = [];
  for (let i = 0; i < 7; i++) {
    g.fish.push({
      id: String(i),
      roof: 0,
      x: g.player.x + 19,
      y: g.player.y + 19,
      gold: i === 6,
      taken: false,
    });
    tick(g, STEP);
  }
  assert.equal(g.fishCount, 7);
  assert.equal(g.bestCombo, 5);
  assert.equal(g.fishScore, 25 * (1 + 2 + 3 + 4 + 5 + 5) + 75 * 5);
  tick(g, STEP);
  assert.equal(g.fishCount, 7);
  assert.equal(g.score, g.distance + g.fishScore);
  g.time += 3;
  tick(g, STEP);
  assert.equal(g.combo, 0);
});
test("chimney collision costs one heart and rescue cannot farm distance or taken fish", () => {
  const g = createGame();
  startGame(g);
  advance(g, 1.4);
  const fish = g.fishCount,
    furthest = g.furthest;
  g.hazards = [{ roof: 0, x: g.player.x + 5, y: g.player.y, w: 29, h: 39 }];
  assert(tick(g, STEP).some((e) => e.type === "hurt"));
  assert.equal(g.lives, 2);
  assert(g.invulnerable > 0);
  assert(g.furthest >= furthest);
  advance(g, 0.6);
  assert.equal(g.lives, 2);
  assert.equal(g.fishCount, fish);
});
test("three falls finish the run; paused and finished states remain frozen", () => {
  const g = createGame();
  startGame(g);
  for (let i = 0; i < 3; i++) {
    g.player.y = 610;
    g.player.vy = 100;
    tick(g, STEP);
  }
  assert.equal(g.phase, "over");
  assert.equal(g.lives, 0);
  const x = g.player.x;
  advance(g, 2);
  assert.equal(g.player.x, x);
  const p = createGame();
  startGame(p);
  advance(p, 0.5);
  assert(pauseGame(p));
  const before = JSON.stringify({ ...p, rng: null });
  advance(p, 10);
  assert.equal(JSON.stringify({ ...p, rng: null }), before);
  startGame(p);
  advance(p, 0.1);
  assert(p.player.x > 110);
});
test("daily completion emits once at 1000 meters and mission progress stays finite", () => {
  const g = createGame({ mode: "daily" });
  startGame(g);
  g.furthest = 10110;
  g.player.x = 10110;
  g.player.y = 100;
  g.player.vy = 0;
  g.invulnerable = 1;
  ensureWorld(g);
  const events = tick(g, STEP);
  assert.equal(g.phase, "complete");
  assert.equal(events.filter((e) => e.type === "finish").length, 1);
  assert.equal(tick(g, STEP).length, 0);
  assert(missions(g).every((m) => Number.isFinite(m.value) && m.target > 0));
});
test("long-running generation stays bounded and invalid deltas cannot corrupt time", () => {
  const g = createGame();
  for (let i = 0; i < 500; i++) {
    g.player.x = i * 370;
    ensureWorld(g);
    g.lastSafe = g.roofs.find((r) => r.x + r.w > g.player.x) || g.roofs.at(-1);
  }
  assert(g.roofs.length < 18);
  assert(g.fish.length < 70);
  startGame(g);
  const before = g.time;
  tick(g, NaN);
  tick(g, Infinity);
  tick(g, -1);
  assert.equal(g.time, before);
});
