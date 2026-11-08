/* Original dinosaur runner engine. Copyright (c) 2026 Noorullah Adel. MIT. */
export const STEP = 1 / 120;
export const PLAYER_X = 88;
export const MODES = {
  classic: {
    name: "Classic",
    description: "One heart. An endless horizon.",
    baseSpeed: 310,
    maxSpeed: 550,
    acceleration: 5.5,
    lives: 1,
    gap: 1.18,
    limit: null,
  },
  chill: {
    name: "Chill",
    description: "A gentler pace. Three little chances.",
    baseSpeed: 230,
    maxSpeed: 380,
    acceleration: 3,
    lives: 3,
    gap: 1.4,
    limit: null,
  },
  sprint: {
    name: "60s Sprint",
    description: "One heart. Make sixty active seconds count.",
    baseSpeed: 350,
    maxSpeed: 600,
    acceleration: 6,
    lives: 1,
    gap: 1.12,
    limit: 60,
  },
};
export function seedNumber(value) {
  let h = 2166136261;
  for (const c of String(value)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}
function random(g) {
  let x = g.randomState;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  g.randomState = x >>> 0 || 1;
  return g.randomState / 4294967296;
}
export function createGame({
  mode = "classic",
  seed = "a-new-little-run",
  id = "local-run",
} = {}) {
  if (!Object.hasOwn(MODES, mode)) throw Error("Unknown game mode");
  const g = {
    id,
    mode,
    seed: String(seed),
    randomState: seedNumber(seed),
    phase: "ready",
    reason: null,
    elapsed: 0,
    distance: 0,
    speed: MODES[mode].baseSpeed,
    lives: MODES[mode].lives,
    invulnerable: 0,
    jumps: 0,
    cleared: 0,
    ducked: 0,
    score: 0,
    accumulator: 0,
    jumpQueued: 0,
    jumpHeld: false,
    duckInput: false,
    player: { y: 0, vy: 0, duck: false },
    obstacles: [],
    nextAt: PLAYER_X + 680,
    spawned: 0,
    nextMilestone: 100,
  };
  generateAhead(g);
  return g;
}
export function startGame(g) {
  if (g.phase !== "ready") return false;
  g.phase = "running";
  return true;
}
export function pauseGame(g) {
  if (g.phase !== "running") return false;
  g.phase = "paused";
  g.jumpHeld = false;
  g.jumpQueued = 0;
  g.duckInput = false;
  return true;
}
export function resumeGame(g) {
  if (g.phase !== "paused") return false;
  g.phase = "running";
  g.accumulator = 0;
  return true;
}
export function requestJump(g, { held = true } = {}) {
  if (g.phase !== "running" || g.jumpHeld) return false;
  g.jumpQueued = 0.12;
  g.jumpHeld = held;
  return true;
}
export function releaseJump(g) {
  const wasHeld = g.jumpHeld;
  g.jumpHeld = false;
  if (wasHeld && g.player.vy > 420) g.player.vy = 420;
}
export function setDucking(g, value) {
  g.duckInput = g.phase === "running" && value === true;
}
function generateAhead(g) {
  while (g.nextAt < g.distance + 1800) {
    const n = g.spawned++,
      roll = random(g);
    let type = "cactus-small";
    if (n > 0) {
      if (n >= 4 && roll < (g.mode === "chill" ? 0.19 : 0.28))
        type = "flyer-low";
      else if (n >= 4 && roll < 0.41 && g.mode !== "chill") type = "flyer-high";
      else if (roll < 0.62) type = "cactus-tall";
      else if (roll < 0.81) type = "rocks";
    }
    const dimensions = {
      "cactus-small": [22, 36, 0],
      "cactus-tall": [25, 59, 0],
      rocks: [48, 25, 0],
      "flyer-low": [46, 23, 33],
      "flyer-high": [46, 23, 88],
    }[type];
    const [width, height, bottom] = dimensions,
      estimatedSpeed = Math.min(MODES[g.mode].maxSpeed, g.speed + 15),
      gap = estimatedSpeed * MODES[g.mode].gap + 75 + random(g) * 150;
    g.obstacles.push({
      id: n,
      x: g.nextAt,
      width,
      height,
      bottom,
      type,
      hit: false,
      passed: false,
      ducked: false,
      plannedGap: gap,
      plannedSpeed: estimatedSpeed,
    });
    g.nextAt += width + gap;
  }
}
export function playerBoxes(g) {
  const p = g.player,
    x = g.distance + PLAYER_X,
    y = p.y;
  return p.duck && y === 0
    ? [{ x: x + 6, y: y + 3, width: 57, height: 22 }]
    : [
        { x: x + 13, y: y + 5, width: 24, height: 38 },
        { x: x + 29, y: y + 36, width: 26, height: 23 },
      ];
}
export function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
export function obstacleBox(o) {
  const inset = o.type.startsWith("flyer") ? 5 : 3;
  return {
    x: o.x + inset,
    y: o.bottom + 2,
    width: o.width - inset * 2,
    height: o.height - 3,
  };
}
function tick(g, events) {
  const config = MODES[g.mode],
    p = g.player;
  g.elapsed += STEP;
  g.speed = Math.min(
    config.maxSpeed,
    config.baseSpeed + config.acceleration * g.elapsed,
  );
  g.distance += g.speed * STEP;
  g.invulnerable = Math.max(0, g.invulnerable - STEP);
  if (p.y <= 0) {
    p.y = 0;
    p.vy = 0;
    p.duck = g.duckInput;
    if (g.jumpQueued > 0) {
      p.vy = g.jumpHeld ? 630 : 500;
      p.duck = false;
      g.jumpQueued = 0;
      g.jumps++;
      events.push({ type: "jump" });
    }
  }
  g.jumpQueued = Math.max(0, g.jumpQueued - STEP);
  if (p.y > 0 || p.vy > 0) {
    p.duck = false;
    p.vy -= (1800 + (g.duckInput ? 2200 : 0)) * STEP;
    p.y = Math.max(0, p.y + p.vy * STEP);
    if (p.y === 0) {
      p.vy = 0;
      p.duck = g.duckInput;
    }
  }
  generateAhead(g);
  for (const o of g.obstacles) {
    if (o.passed) continue;
    const box = obstacleBox(o),
      near =
        o.x < g.distance + PLAYER_X + 66 &&
        o.x + o.width > g.distance + PLAYER_X + 6;
    if (near && o.type === "flyer-low" && p.duck && p.y === 0) o.ducked = true;
    if (!o.hit && playerBoxes(g).some((b) => overlaps(b, box))) {
      o.hit = true;
      if (g.invulnerable <= 0) {
        g.lives--;
        events.push({ type: "hit", lives: g.lives, obstacle: o.type });
        g.jumpQueued = 0;
        p.y = 0;
        p.vy = 0;
        if (g.lives <= 0) {
          g.phase = "ended";
          g.reason = "collision";
          events.push({ type: "end", reason: "collision" });
          break;
        }
        g.invulnerable = 1.25;
      }
    }
    if (o.x + o.width < g.distance + PLAYER_X + 6) {
      o.passed = true;
      if (!o.hit) {
        g.cleared++;
        if (o.ducked) g.ducked++;
        events.push({ type: "clear", ducked: o.ducked });
      }
    }
  }
  g.obstacles = g.obstacles.filter((o) => o.x + o.width > g.distance - 70);
  g.score = Math.min(9999999, Math.floor(g.distance / 10) + g.cleared * 5);
  while (g.score >= g.nextMilestone) {
    events.push({ type: "milestone", score: g.nextMilestone });
    g.nextMilestone += 100;
  }
  if (
    g.phase === "running" &&
    config.limit &&
    g.elapsed + 1e-7 >= config.limit
  ) {
    g.elapsed = config.limit;
    g.phase = "ended";
    g.reason = "finished";
    events.push({ type: "end", reason: "finished" });
  }
}
export function advance(g, dt) {
  const events = [];
  if (g.phase !== "running" || !Number.isFinite(dt) || dt <= 0) return events;
  g.accumulator += Math.min(dt, 0.12);
  while (g.accumulator + 1e-12 >= STEP && g.phase === "running") {
    g.accumulator -= STEP;
    tick(g, events);
  }
  if (g.phase === "ended") g.accumulator = 0;
  return events;
}
export function snapshot(g) {
  return {
    mode: g.mode,
    score: g.score,
    meters: Math.floor(g.distance / 10),
    seconds: Math.floor(g.elapsed),
    jumps: g.jumps,
    cleared: g.cleared,
    ducked: g.ducked,
    done: g.phase === "ended",
    reason: g.reason,
  };
}
export function goals(g) {
  return [
    {
      title: "A clear little path",
      detail: "Clear 10 obstacles",
      value: g.cleared,
      target: 10,
    },
    {
      title: "Keep your head down",
      detail: "Duck under 3 low flyers",
      value: g.ducked,
      target: 3,
    },
    {
      title: "A little further",
      detail: "Travel 500 metres",
      value: Math.floor(g.distance / 10),
      target: 500,
    },
  ];
}
