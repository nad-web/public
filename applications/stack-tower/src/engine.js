/* Original Stack Tower engine. Copyright 2026 Noorullah Adel. MIT. */
export const STEP = 1 / 120;
export const MODES = {
  classic: { speed: 110, accel: 3, max: 240, tolerance: 4 },
  chill: { speed: 72, accel: 1.8, max: 160, tolerance: 8 },
};
export function createGame({ mode = "classic", seed = 1 } = {}) {
  if (!Object.hasOwn(MODES, mode)) throw Error("Unknown mode");
  const g = {
    mode,
    seed: seed >>> 0 || 1,
    phase: "ready",
    elapsed: 0,
    accumulator: 0,
    height: 0,
    score: 0,
    perfect: 0,
    streak: 0,
    bestStreak: 0,
    blocks: [{ x: 0, z: 0, w: 150, d: 150, y: 0, h: 24 }],
    moving: null,
    falling: [],
    cooldown: 0,
    last: "",
    lastPoints: 0,
  };
  spawn(g);
  return g;
}
function random(g) {
  let x = g.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  g.seed = x >>> 0 || 1;
  return g.seed / 4294967296;
}
function spawn(g) {
  const b = g.blocks.at(-1),
    axis = g.height % 2 ? "z" : "x",
    side = random(g) < 0.5 ? -1 : 1;
  g.moving = {
    ...b,
    y: b.y + 24,
    axis,
    origin: b[axis],
    range: 185,
    dir: -side,
  };
  g.moving[axis] = b[axis] + side * 185;
}
export function startGame(g) {
  if (g.phase !== "ready") return false;
  g.phase = "running";
  return true;
}
export function pauseGame(g) {
  if (g.phase !== "running") return false;
  g.phase = "paused";
  return true;
}
export function resumeGame(g) {
  if (g.phase !== "paused") return false;
  g.phase = "running";
  g.accumulator = 0;
  g.cooldown = 0.15;
  return true;
}
export function intersect(base, moving, tolerance) {
  const axis = moving.axis,
    size = axis === "x" ? "w" : "d",
    delta = moving[axis] - base[axis],
    perfect =
      Math.abs(delta) <=
      Math.min(tolerance, Math.min(base[size], moving[size]) * 0.15);
  if (perfect)
    return {
      perfect: true,
      placed: { ...moving, [axis]: base[axis] },
      cut: null,
    };
  const lo = Math.max(
      base[axis] - base[size] / 2,
      moving[axis] - moving[size] / 2,
    ),
    hi = Math.min(base[axis] + base[size] / 2, moving[axis] + moving[size] / 2);
  if (hi - lo < 1) return { perfect: false, placed: null, cut: { ...moving } };
  const placed = { ...moving, [axis]: (lo + hi) / 2, [size]: hi - lo },
    cutSize = moving[size] - placed[size],
    cut = {
      ...moving,
      [size]: cutSize,
      [axis]: delta > 0 ? hi + cutSize / 2 : lo - cutSize / 2,
    };
  return { perfect: false, placed, cut };
}
export function drop(g) {
  if (g.phase !== "running" || g.cooldown > 0) return null;
  const answer = intersect(g.blocks.at(-1), g.moving, MODES[g.mode].tolerance);
  g.cooldown = 0.13;
  if (answer.cut) g.falling.push({ ...answer.cut, vy: 0, age: 0 });
  if (!answer.placed) {
    g.phase = "ended";
    g.last = "miss";
    g.moving = null;
    return { type: "miss" };
  }
  g.height++;
  g.lastPoints = 10;
  g.streak = answer.perfect ? g.streak + 1 : 0;
  g.bestStreak = Math.max(g.bestStreak, g.streak);
  if (answer.perfect) {
    g.perfect++;
    g.lastPoints += 5;
    if (g.streak % 3 === 0) g.lastPoints += 10;
  }
  g.score += g.lastPoints;
  g.last = answer.perfect ? "perfect" : "placed";
  g.blocks.push(answer.placed);
  if (g.blocks.length > 24) g.blocks.shift();
  spawn(g);
  return { type: g.last, points: g.lastPoints, streak: g.streak };
}
export function advance(g, dt) {
  if (
    !Number.isFinite(dt) ||
    dt <= 0 ||
    g.phase === "paused" ||
    g.phase === "ready"
  )
    return;
  g.accumulator += Math.min(dt, 0.12);
  while (g.accumulator + 1e-10 >= STEP) {
    g.accumulator -= STEP;
    g.cooldown = Math.max(0, g.cooldown - STEP);
    if (g.phase === "running") {
      g.elapsed += STEP;
      const m = g.moving,
        c = MODES[g.mode],
        speed = Math.min(c.max, c.speed + g.height * c.accel);
      m[m.axis] += m.dir * speed * STEP;
      const delta = m[m.axis] - m.origin;
      if (Math.abs(delta) > m.range) {
        m[m.axis] =
          m.origin + Math.sign(delta) * (2 * m.range - Math.abs(delta));
        m.dir = -m.dir;
      }
    }
    for (const p of g.falling) {
      p.age += STEP;
      p.vy -= 520 * STEP;
      p.y += p.vy * STEP;
    }
    g.falling = g.falling.filter((p) => p.age < 1.3);
  }
}
export function result(g) {
  return {
    mode: g.mode,
    height: g.height,
    score: g.score,
    perfect: g.perfect,
    streak: g.bestStreak,
    seconds: Math.floor(g.elapsed),
  };
}
