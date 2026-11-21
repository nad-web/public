/* Validation for a complete, resumable local shift. Noorullah Adel · MIT. */
import { CITIES, MODES, dailyPlan } from "./cities.js";
import { SHIFT, MAX_STOPS, score, seats, aboard, waiting } from "./engine.js";
const int = (n, min = 0, max = 1e9) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
const day = (str) =>
  typeof str === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(str) &&
  Number.isFinite(Date.parse(str + "T00:00:00Z")) &&
  new Date(str + "T00:00:00Z").toISOString().slice(0, 10) === str;
function requireValue(ok) {
  if (!ok) throw Error("Unrecognized local shift data.");
}
export function recordKey(s) {
  return s.mode === "daily" ? "daily:" + s.date : s.mode + ":" + s.city;
}
export function newBook() {
  return { version: 1, sound: false, bests: [], active: null };
}
export function finishRecord(book, s) {
  if (s.phase !== "done") return;
  const key = recordKey(s),
    fresh = { key, score: score(s), served: s.served };
  const old = book.bests.find((r) => r.key === key);
  if (
    !old ||
    fresh.score > old.score ||
    (fresh.score === old.score && fresh.served > old.served)
  ) {
    book.bests = [...book.bests.filter((r) => r.key !== key), fresh];
  }
  const daily = book.bests
    .filter((r) => r.key.startsWith("daily:"))
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 30);
  book.bests = book.bests
    .filter((r) => !r.key.startsWith("daily:"))
    .concat(daily);
}
export function validateGame(s) {
  requireValue(
    s &&
      s.version === 1 &&
      Object.keys(MODES).includes(s.mode) &&
      int(s.city, 0, CITIES.length - 1),
  );
  requireValue(
    ["ready", "running", "paused", "done"].includes(s.phase) &&
      int(s.seed, 0, 0xffffffff) &&
      int(s.rng, 0, 0xffffffff),
  );
  if (s.mode === "daily") {
    requireValue(day(s.date));
    const d = dailyPlan(s.date);
    requireValue(s.city === d.city && s.seed === d.seed);
  } else requireValue(s.date === "");
  requireValue(
    int(s.clock, 0, s.mode === "easy" ? 1e9 : SHIFT) && int(s.open, 4, 8),
  );
  requireValue(
    [
      "served",
      "spawned",
      "missed",
      "through",
      "transfers",
      "serial",
      "ordersWon",
      "nextOrder",
      "nextRider",
      "boostUntil",
      "boostReady",
    ].every((k) => int(s[k], 0, 2e9)),
  );
  requireValue(
    s.through <= s.served &&
      s.serial <= s.spawned &&
      s.ordersWon <= s.served / 3,
  );
  requireValue(
    Array.isArray(s.routes) &&
      s.routes.length === 3 &&
      Array.isArray(s.trains) &&
      s.trains.length === 3 &&
      Array.isArray(s.queues) &&
      s.queues.length === 8,
  );
  const id = (n) => int(n, 0, s.open - 1),
    seen = new Set();
  function rider(p) {
    requireValue(
      p &&
        int(p.id, 1, s.serial) &&
        !seen.has(p.id) &&
        id(p.dest) &&
        int(p.last, -1, 2) &&
        int(p.wait, 0, 311) &&
        typeof p.changed === "boolean",
    );
    seen.add(p.id);
  }
  s.queues.forEach((q, k) => {
    requireValue(
      Array.isArray(q) && q.length <= s.spawned && (k < s.open || !q.length),
    );
    q.forEach((p) => {
      rider(p);
      requireValue(p.dest !== k);
    });
  });
  s.routes.forEach((r, i) => {
    requireValue(
      Array.isArray(r) &&
        r.length !== 1 &&
        r.length <= MAX_STOPS &&
        r.every(id) &&
        new Set(r).size === r.length,
    );
    const t = s.trains[i];
    if (!t) {
      requireValue(t === null && !r.length);
      return;
    }
    requireValue(
      id(t.at) &&
        (t.to === null || (id(t.to) && t.to !== t.at)) &&
        Number.isFinite(t.pct) &&
        t.pct >= 0 &&
        t.pct < 1 &&
        (t.dir === 1 || t.dir === -1) &&
        int(t.dwell, 0, 3),
    );
    requireValue(Array.isArray(t.load) && t.load.length <= seats(s));
    t.load.forEach(rider);
  });
  if (s.order) {
    const o = s.order;
    requireValue(
      id(o.target) &&
        o.goal === 3 &&
        int(o.count, 0, o.goal) &&
        int(o.due) &&
        o.due >= s.clock &&
        o.won === (o.goal === o.count),
    );
  } else requireValue(s.order === null);
  requireValue(s.spawned === s.served + s.missed + waiting(s) + aboard(s));
  return s;
}
export function validateBook(raw) {
  requireValue(
    raw?.version === 1 &&
      typeof raw.sound === "boolean" &&
      Array.isArray(raw.bests) &&
      raw.bests.length <= 36,
  );
  const keys = new Set();
  for (const b of raw.bests) {
    requireValue(
      b &&
        typeof b.key === "string" &&
        (/^(shift|easy):[0-2]$/.test(b.key) ||
          (b.key.startsWith("daily:") && day(b.key.slice(6)))) &&
        !keys.has(b.key) &&
        int(b.score, 0, 2e10) &&
        int(b.served),
    );
    keys.add(b.key);
  }
  if (raw.active !== null) validateGame(raw.active);
  return {
    version: 1,
    sound: raw.sound,
    bests: raw.bests.map(({ key, score, served }) => ({ key, score, served })),
    active: raw.active,
  };
}
