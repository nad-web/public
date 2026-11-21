/* Dayline Dispatch · Copyright 2026 Noorullah Adel · MIT. */
import { CITIES, MODES, dailyPlan, edgeLength } from "./cities.js";

export const TICKS = 5;
export const SHIFT = 180 * TICKS;
export const MAX_STOPS = 5;
export const OPENINGS = [36, 73, 108, 139].map((seconds) => seconds * TICKS);
const WAVE = 8 * TICKS,
  RECHARGE = 30 * TICKS,
  MAX_WAIT = 62 * TICKS;
const itineraries = new WeakMap();
export const seats = (s) => 5 + Math.min(3, s.ordersWon);
export const score = (s) => 10 * s.served + 4 * s.through + 50 * s.ordersWon;
export const waiting = (s) => s.queues.reduce((n, q) => n + q.length, 0);
export const aboard = (s) =>
  s.trains.reduce((n, t) => n + (t?.load.length || 0), 0);
export const medal = (s) =>
  score(s) >= 800
    ? "Gold ticket"
    : score(s) >= 480
      ? "Silver ticket"
      : score(s) >= 220
        ? "Bronze ticket"
        : "Service ticket";
function random(s, n) {
  s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
  return Math.floor((s.rng / 4294967296) * n);
}
function newTrain(at) {
  return { at, to: null, pct: 0, dir: 1, dwell: 2, load: [] };
}
function addRider(s, origin, dest) {
  if (origin === dest) return;
  if (s.queues[origin].length >= 18) {
    if (s.mode !== "easy") {
      s.spawned++;
      s.missed++;
    }
    return;
  }
  const person = { id: ++s.serial, dest, wait: 0, last: -1, changed: false };
  s.spawned++;
  s.queues[origin].push(person);
}
export function createGame({
  mode = "shift",
  city = 0,
  seed = 1,
  date = "",
} = {}) {
  if (!Object.prototype.hasOwnProperty.call(MODES, mode) || !CITIES[city])
    throw Error("Unknown shift");
  if (mode === "daily") ({ city, seed, date } = dailyPlan(date || undefined));
  const s = {
    version: 1,
    mode,
    city,
    seed: seed >>> 0,
    date,
    phase: "ready",
    rng: seed >>> 0,
    clock: 0,
    open: 4,
    routes: [[0, 1, 2], [], []],
    trains: [newTrain(0), null, null],
    queues: Array.from({ length: 8 }, () => []),
    spawned: 0,
    serial: 0,
    served: 0,
    missed: 0,
    through: 0,
    transfers: 0,
    ordersWon: 0,
    order: null,
    nextOrder: 10 * TICKS,
    nextRider: 9,
    boostUntil: 0,
    boostReady: 0,
  };
  for (const [from, to] of [
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 0],
    [3, 1],
  ])
    addRider(s, from, to);
  return s;
}
export function start(s) {
  if (s.phase !== "ready" && s.phase !== "paused") return false;
  s.phase = "running";
  return true;
}
export function pause(s) {
  if (s.phase === "running") {
    s.phase = "paused";
    return true;
  }
  return false;
}
export function endShift(s) {
  if (s.phase === "done") return false;
  s.phase = "done";
  return true;
}
export function greenWave(s) {
  if (s.phase !== "running" || s.clock < s.boostReady) return false;
  s.boostUntil = s.clock + WAVE;
  s.boostReady = s.clock + RECHARGE;
  return true;
}
// Ride edges retain line identity. An interchange costs roughly one short ride.
export function routeLeg(s, from, to, previous = -1) {
  if (from === to || from < 0 || to < 0 || from >= s.open || to >= s.open)
    return null;
  let cache = itineraries.get(s);
  if (!cache) {
    cache = new Map();
    itineraries.set(s, cache);
  }
  const key = (from * 8 + to) * 4 + previous + 1;
  if (cache.has(key)) return cache.get(key);
  const fringe = [{ stop: from, line: previous, cost: 0, first: null }],
    best = new Map();
  let answer = null;
  while (fringe.length) {
    fringe.sort((a, b) => a.cost - b.cost);
    const cur = fringe.shift(),
      stateKey = cur.stop * 4 + cur.line + 1;
    if (best.has(stateKey)) continue;
    best.set(stateKey, cur.cost);
    if (cur.stop === to) {
      answer = cur.first;
      break;
    }
    s.routes.forEach((r, line) => {
      const i = r.indexOf(cur.stop);
      if (i < 0) return;
      for (const dir of [-1, 1]) {
        const next = r[i + dir];
        if (next === undefined || best.has(next * 4 + line + 1)) continue;
        const change = cur.line >= 0 && cur.line !== line ? 18 : 0;
        const cost = cur.cost + edgeLength(s.city, cur.stop, next) + 5 + change;
        fringe.push({
          stop: next,
          line,
          cost,
          first: cur.first || { line, next },
        });
      }
    });
  }
  cache.set(key, answer);
  return answer;
}
function nextStop(s, line, t) {
  const r = s.routes[line],
    i = r.indexOf(t.at);
  if (i < 0 || r.length < 2) return null;
  if (i === 0) t.dir = 1;
  if (i === r.length - 1) t.dir = -1;
  return r[i + t.dir];
}
function arrive(s, line, t, events) {
  const next = nextStop(s, line, t),
    keep = [];
  for (const p of t.load) {
    if (p.dest === t.at) {
      s.served++;
      if (p.changed) s.through++;
      if (
        s.order &&
        !s.order.won &&
        s.order.target === t.at &&
        s.clock <= s.order.due
      ) {
        s.order.count++;
        if (s.order.count === s.order.goal) {
          s.order.won = true;
          s.ordersWon++;
          events.push({ kind: "order-won", stop: t.at });
        }
      }
      events.push({ kind: "delivered", stop: t.at });
    } else {
      const leg = routeLeg(s, t.at, p.dest, line);
      if (next !== null && leg?.line === line && leg.next === next)
        keep.push(p);
      else s.queues[t.at].push(p);
    }
  }
  t.load = keep;
}
function startLeg(s, line, t) {
  const route = s.routes[line],
    next = nextStop(s, line, t);
  if (next === null) {
    if (route.length === 0) {
      s.trains[line] = null;
      return;
    }
    // An empty train runs to a new alignment after finishing its old segment.
    t.to = route.reduce(
      (best, id) =>
        edgeLength(s.city, t.at, id) < edgeLength(s.city, t.at, best)
          ? id
          : best,
      route[0],
    );
  } else {
    const remaining = [];
    for (const p of s.queues[t.at]) {
      const leg = routeLeg(s, t.at, p.dest, p.last);
      if (t.load.length < seats(s) && leg?.line === line && leg.next === next) {
        if (p.last >= 0 && p.last !== line) {
          p.changed = true;
          s.transfers++;
        }
        p.last = line;
        t.load.push(p);
      } else remaining.push(p);
    }
    s.queues[t.at] = remaining;
    t.to = next;
  }
  t.pct = 0;
}
export function editLine(s, line, stops) {
  if (
    s.phase === "done" ||
    !Number.isInteger(line) ||
    line < 0 ||
    line > 2 ||
    !Array.isArray(stops)
  )
    return false;
  if (
    stops.length === 1 ||
    stops.length > MAX_STOPS ||
    new Set(stops).size !== stops.length
  )
    return false;
  if (stops.some((x) => !Number.isInteger(x) || x < 0 || x >= s.open))
    return false;
  if (
    s.routes[line].length === stops.length &&
    stops.every((x, i) => x === s.routes[line][i])
  )
    return true;
  s.routes[line] = [...stops];
  itineraries.delete(s);
  const t = s.trains[line];
  if (!t && stops.length) s.trains[line] = newTrain(stops[0]);
  else if (t && t.to === null) {
    arrive(s, line, t, []);
    if (!stops.length) s.trains[line] = null;
    else t.dwell = Math.max(t.dwell, 1);
  }
  return true;
}
function demand(s) {
  const origin = random(s, s.open);
  let destination = random(s, s.open - 1);
  if (destination >= origin) destination++;
  const draw = random(s, 3);
  if (s.order && s.order.target !== origin && draw === 0)
    destination = s.order.target;
  addRider(s, origin, destination);
  const interval =
    s.mode === "easy"
      ? 18
      : Math.max(5, 11 - Math.floor(s.clock / (50 * TICKS)));
  s.nextRider = s.clock + interval + random(s, 5);
}
function startOrder(s, events) {
  const target = random(s, s.open);
  s.order = {
    target,
    goal: 3,
    count: 0,
    due: s.clock + 44 * TICKS,
    won: false,
  };
  s.nextOrder = s.clock + 60 * TICKS;
  for (let i = 0; i < 2; i++) {
    let origin = random(s, s.open - 1);
    if (origin >= target) origin++;
    addRider(s, origin, target);
  }
  events.push({ kind: "order", stop: target });
}
export function tick(s) {
  const events = [];
  if (s.phase !== "running") return events;
  s.clock++;
  if (s.open < 8 && s.clock >= OPENINGS[s.open - 4]) {
    const at = s.open++;
    events.push({ kind: "opening", stop: at });
    addRider(s, at, 1);
  }
  if (s.order && s.clock > s.order.due) {
    if (!s.order.won) events.push({ kind: "order-ended" });
    s.order = null;
  }
  if (
    s.clock === s.nextOrder &&
    (s.mode === "easy" || s.clock + 44 * TICKS <= SHIFT)
  )
    startOrder(s, events);
  if (s.clock >= s.nextRider) demand(s);
  for (let k = 0; k < s.open; k++) {
    if (s.mode === "easy") continue;
    s.queues[k] = s.queues[k].filter((p) => {
      p.wait++;
      if (p.wait > MAX_WAIT) {
        s.missed++;
        return false;
      }
      return true;
    });
  }
  for (let i = 0; i < s.trains.length; i++) {
    const t = s.trains[i];
    if (!t) continue;
    if (t.to === null) {
      if (t.dwell > 0) t.dwell--;
      else startLeg(s, i, t);
      continue;
    }
    const length = edgeLength(s.city, t.at, t.to);
    const speed = s.clock <= s.boostUntil ? 21.6 : 14;
    t.pct += speed / TICKS / Math.max(0.001, length);
    if (t.pct >= 1) {
      t.at = t.to;
      t.to = null;
      t.pct = 0;
      t.dwell = 3;
      arrive(s, i, t, events);
      if (!s.routes[i].length) s.trains[i] = null;
    }
  }
  if (s.mode !== "easy" && s.clock >= SHIFT) {
    s.phase = "done";
    events.push({ kind: "finish" });
  }
  return events;
}
