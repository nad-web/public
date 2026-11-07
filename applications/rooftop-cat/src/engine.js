/* Copyright (c) 2026 Noorullah Adel. Original game engine. MIT. */
export const WORLD_HEIGHT = 520,
  STEP = 1 / 120;
export const MODES = Object.freeze({
  cozy: {
    name: "Cozy stroll",
    speed: 185,
    maximum: 235,
    gap: [64, 104],
    hazard: 0.42,
  },
  chase: {
    name: "Rooftop chase",
    speed: 225,
    maximum: 290,
    gap: [90, 146],
    hazard: 0.7,
  },
  daily: {
    name: "Daily route",
    speed: 225,
    maximum: 275,
    gap: [85, 138],
    hazard: 0.6,
  },
});
export function seedNumber(value) {
  let hash = 2166136261;
  for (const char of String(value))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function randomSource(seed) {
  let state = seedNumber(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function createGame({
  mode = "cozy",
  seed = "a-new-rooftop",
  date = dateKey(),
} = {}) {
  if (!MODES[mode]) throw Error("Unknown game mode");
  const first = { id: 0, x: 0, y: 384, w: 590, style: 0 };
  const game = {
    mode,
    date,
    seed,
    rng: randomSource(mode === "daily" ? "rooftop-cat:daily:" + date : seed),
    phase: "ready",
    time: 0,
    score: 0,
    distance: 0,
    fishCount: 0,
    combo: 0,
    bestCombo: 0,
    lastFish: -10,
    lives: 3,
    furthest: 110,
    speed: MODES[mode].speed,
    buffer: 0,
    coyote: 0.1,
    jumpCooldown: 0,
    invulnerable: 0,
    nextId: 1,
    lastSafe: first,
    player: { x: 110, y: 346, w: 38, h: 38, vy: 0, grounded: true, jumps: 0 },
    roofs: [first],
    hazards: [],
    fish: [240, 305, 370].map((x, i) => ({
      id: `0-${i}`,
      roof: 0,
      x,
      y: 340,
      gold: false,
      taken: false,
    })),
    fishScore: 0,
  };
  ensureWorld(game);
  return game;
}
export function ensureWorld(game) {
  const options = MODES[game.mode];
  while (game.roofs.at(-1).x + game.roofs.at(-1).w < game.player.x + 1900) {
    const last = game.roofs.at(-1),
      gap = options.gap[0] + game.rng() * (options.gap[1] - options.gap[0]);
    const roof = {
      id: game.nextId++,
      x: last.x + last.w + gap,
      y: Math.max(338, Math.min(408, last.y + (game.rng() - 0.5) * 58)),
      w: 265 + game.rng() * 155,
      style: Math.floor(game.rng() * 4),
    };
    game.roofs.push(roof);
    if (roof.id > 1 && game.rng() < options.hazard)
      game.hazards.push({
        roof: roof.id,
        x: roof.x + 152 + game.rng() * (roof.w - 225),
        y: roof.y - 39,
        w: 29,
        h: 39,
      });
    for (let i = 0; i < 3; i++)
      game.fish.push({
        id: `${roof.id}-${i}`,
        roof: roof.id,
        x: roof.x + 65 + i * 48,
        y: roof.y - 48 - Math.sin((i * Math.PI) / 2) * 24,
        gold: i === 1 && roof.id % 5 === 0,
        taken: false,
      });
    if (roof.id % 4 === 0)
      game.fish.push({
        id: `${roof.id}-sky`,
        roof: roof.id,
        x: roof.x + roof.w - 65,
        y: roof.y - 132,
        gold: true,
        taken: false,
      });
  }
  const oldest = Math.min(game.player.x - 950, game.lastSafe.x - 30);
  game.roofs = game.roofs.filter((r) => r.x + r.w >= oldest);
  const keep = new Set(game.roofs.map((r) => r.id));
  game.hazards = game.hazards.filter((h) => keep.has(h.roof));
  game.fish = game.fish.filter((f) => keep.has(f.roof));
}
export function startGame(game) {
  if (game.phase === "ready" || game.phase === "paused") game.phase = "running";
}
export function pauseGame(game) {
  if (game.phase !== "running") return false;
  game.phase = "paused";
  game.buffer = 0;
  return true;
}
function overlaps(a, b, inset = 0) {
  return (
    a.x + a.w - inset > b.x &&
    a.x + inset < b.x + b.w &&
    a.y + a.h - inset > b.y &&
    a.y + inset < b.y + b.h
  );
}
function loseLife(game, reason, events) {
  game.lives--;
  game.combo = 0;
  events.push({ type: "hurt", reason, lives: game.lives });
  if (game.lives <= 0) {
    game.phase = "over";
    events.push({ type: "end" });
    return;
  }
  const roof = game.lastSafe;
  Object.assign(game.player, {
    x: roof.x + 38,
    y: roof.y - game.player.h,
    vy: 0,
    grounded: true,
    jumps: 0,
  });
  game.invulnerable = 2;
  game.buffer = 0;
  game.coyote = 0.1;
}
export function tick(game, delta = STEP, input = {}) {
  const events = [];
  if (game.phase !== "running" || !Number.isFinite(delta) || delta <= 0)
    return events;
  const dt = Math.min(delta, 1 / 30);
  game.time += dt;
  game.buffer = input.jump ? 0.12 : Math.max(0, game.buffer - dt);
  game.jumpCooldown = Math.max(0, game.jumpCooldown - dt);
  game.invulnerable = Math.max(0, game.invulnerable - dt);
  const player = game.player;
  game.coyote = player.grounded ? 0.1 : Math.max(0, game.coyote - dt);
  if (game.buffer > 0 && game.jumpCooldown === 0) {
    let didJump = false;
    if (player.grounded || game.coyote > 0) {
      player.vy = -535;
      player.jumps = 1;
      game.coyote = 0;
      didJump = true;
    } else if (player.jumps < 2) {
      player.vy = -495;
      player.jumps = 2;
      didJump = true;
    }
    if (didJump) {
      player.grounded = false;
      game.buffer = 0;
      game.jumpCooldown = 0.09;
      events.push({ type: "jump", second: player.jumps === 2 });
    }
  }
  const oldBottom = player.y + player.h;
  game.speed = Math.min(
    MODES[game.mode].maximum,
    MODES[game.mode].speed + game.distance * 0.045,
  );
  player.x += game.speed * dt;
  player.vy += 1500 * dt;
  player.y += player.vy * dt;
  player.grounded = false;
  if (player.vy >= 0)
    for (const roof of game.roofs)
      if (
        player.x + player.w - 5 > roof.x &&
        player.x + 5 < roof.x + roof.w &&
        oldBottom <= roof.y + 2 &&
        player.y + player.h >= roof.y
      ) {
        player.y = roof.y - player.h;
        player.vy = 0;
        player.grounded = true;
        player.jumps = 0;
        game.lastSafe = roof;
        break;
      }
  game.furthest = Math.max(game.furthest, player.x);
  game.distance = Math.floor((game.furthest - 110) / 10);
  game.score = game.distance + game.fishScore;
  if (player.y > WORLD_HEIGHT + 70) loseLife(game, "gap", events);
  else if (
    game.invulnerable === 0 &&
    game.hazards.some((h) => overlaps(player, h, 7))
  )
    loseLife(game, "chimney", events);
  if (game.phase !== "running") return events;
  for (const fish of game.fish)
    if (
      !fish.taken &&
      Math.hypot(
        player.x + player.w / 2 - fish.x,
        player.y + player.h / 2 - fish.y,
      ) < 31
    ) {
      fish.taken = true;
      game.combo =
        game.time - game.lastFish < 2.6 ? Math.min(5, game.combo + 1) : 1;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      game.lastFish = game.time;
      game.fishCount++;
      const points = (fish.gold ? 75 : 25) * game.combo;
      game.fishScore += points;
      events.push({
        type: "fish",
        x: fish.x,
        y: fish.y,
        points,
        gold: fish.gold,
        combo: game.combo,
      });
    }
  if (game.time - game.lastFish >= 2.6) game.combo = 0;
  game.score = game.distance + game.fishScore;
  if (game.mode === "daily" && game.distance >= 1000) {
    game.phase = "complete";
    events.push({ type: "finish" }, { type: "end" });
  }
  ensureWorld(game);
  return events;
}
export function missions(game) {
  return [
    {
      name: "Find your feet",
      label: "Travel 250 m",
      value: game.distance,
      target: 250,
    },
    {
      name: "A little fish feast",
      label: "Catch 15 fish",
      value: game.fishCount,
      target: 15,
    },
    {
      name: "In the flow",
      label: "Build a ×5 streak",
      value: game.bestCombo,
      target: 5,
    },
  ].map((m) => ({ ...m, complete: m.value >= m.target }));
}
