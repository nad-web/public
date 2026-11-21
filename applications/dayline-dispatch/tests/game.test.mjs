import test from "node:test";
import assert from "node:assert/strict";
import { CITIES, dailyPlan, utcDay } from "../src/cities.js";
import {
  createGame,
  TICKS,
  SHIFT,
  OPENINGS,
  start,
  pause,
  tick,
  editLine,
  greenWave,
  routeLeg,
  score,
  seats,
  waiting,
  aboard,
  endShift,
  medal,
} from "../src/engine.js";
import {
  newBook,
  validateGame,
  validateBook,
  recordKey,
  finishRecord,
} from "../src/records.js";
import { createStorage } from "../src/storage.js";
import { createAudio } from "../src/audio.js";
import { toggleFullscreen } from "../src/fullscreen.js";

function clock(s, n) {
  for (let i = 0; i < n; i++) tick(s);
}
function demandFreeRider(from, to) {
  const s = createGame();
  s.queues = Array.from({ length: 8 }, () => []);
  s.queues[from].push({ id: 1, dest: to, wait: 0, last: -1, changed: false });
  s.serial = 1;
  s.spawned = 1;
  s.nextRider = 9000;
  s.nextOrder = 9000;
  return s;
}
function design(s) {
  editLine(s, 0, [0, 1, 2]);
  editLine(
    s,
    1,
    [3, 1, 4, 6].filter((id) => id < s.open),
  );
  if (s.open >= 6)
    editLine(
      s,
      2,
      [5, 2, 7, 4].filter((id) => id < s.open),
    );
}
test("services transfer a real passenger and credit the transfer only upon arrival", () => {
  const s = demandFreeRider(0, 3);
  editLine(s, 0, [0, 1]);
  editLine(s, 1, [1, 3]);
  start(s);
  assert.deepEqual(routeLeg(s, 0, 3), { line: 0, next: 1 });
  while (!s.served && s.clock < 170) {
    tick(s);
    validateGame(s);
  }
  assert.equal(s.served, 1);
  assert.equal(s.transfers, 1);
  assert.equal(s.through, 1);
  assert.equal(score(s), 14);
});
test("edited routes invalidate cached itineraries and reject closed, duplicate and singleton stops", () => {
  const s = createGame();
  assert.equal(routeLeg(s, 0, 3), null);
  assert(editLine(s, 1, [1, 3]));
  assert(routeLeg(s, 0, 3));
  const old = JSON.stringify(s.routes);
  for (const r of [[0], [0, 0], [1, 7], [1, -1], [0, 1, 2, 3, 1, 0], null])
    assert.equal(editLine(s, 1, r), false);
  assert.equal(JSON.stringify(s.routes), old);
  assert(editLine(s, 1, []));
  assert.equal(routeLeg(s, 0, 3), null);
});
test("suspending an occupied train finishes its segment and returns every rider to an open platform", () => {
  const s = demandFreeRider(0, 2);
  start(s);
  while (s.trains[0].to === null) tick(s);
  assert.equal(aboard(s), 1);
  const target = s.trains[0].to;
  editLine(s, 0, []);
  assert.equal(s.trains[0].to, target);
  assert.equal(aboard(s), 1);
  while (s.trains[0]) tick(s);
  assert.equal(s.queues[target][0].id, 1);
  assert.equal(waiting(s), 1);
  assert.equal(aboard(s), 0);
  validateGame(s);
  editLine(s, 0, [target, 2]);
  while (!s.served && s.clock < 170) tick(s);
  assert.equal(s.served, 1);
  validateGame(s);
});
test("a mid-segment reroute finishes the original segment before its new alignment", () => {
  const s = demandFreeRider(0, 2);
  start(s);
  while (s.trains[0].to === null) tick(s);
  const t = s.trains[0];
  editLine(s, 0, [2, 3]);
  assert.equal(t.to, 1);
  while (t.to !== null) tick(s);
  assert.equal(t.at, 1);
  assert.equal(s.queues[1].length, 1);
  assert.equal(t.load.length, 0);
  while (t.to === null) tick(s);
  assert([2, 3].includes(t.to));
  validateGame(s);
});
test("only running time counts toward expansion, Green Wave, recharge and the shift limit", () => {
  const s = createGame();
  clock(s, 20);
  assert.equal(s.clock, 0);
  assert(!greenWave(s));
  start(s);
  assert(greenWave(s));
  assert.equal(s.boostUntil, 8 * TICKS);
  assert.equal(s.boostReady, 30 * TICKS);
  clock(s, 20);
  pause(s);
  const before = structuredClone(s);
  clock(s, 100);
  assert.deepEqual(s, before);
  start(s);
  clock(s, 30 * TICKS - s.clock - 1);
  assert(!greenWave(s));
  tick(s);
  assert(greenWave(s));
  const opened = [];
  while (s.phase === "running") {
    for (const e of tick(s)) if (e.kind === "opening") opened.push(s.clock);
  }
  assert.deepEqual(opened, OPENINGS);
  assert.equal(s.clock, SHIFT);
  assert.equal(s.open, 8);
  clock(s, 20);
  assert.equal(s.clock, SHIFT);
  assert(!start(s));
  assert(!editLine(s, 1, [1, 2]));
});
test("every city rewards a connected network, validates all active riders, and can reach gold", () => {
  for (let i = 0; i < CITIES.length; i++) {
    const active = createGame({ city: i, seed: 42 }),
      idle = structuredClone(active);
    start(active);
    start(idle);
    const won = [];
    let lastOpen = 0;
    while (active.phase === "running") {
      if (lastOpen !== active.open) {
        lastOpen = active.open;
        design(active);
      }
      greenWave(active);
      for (const e of tick(active))
        if (e.kind === "order-won") won.push(active.order.due);
      tick(idle);
      validateGame(active);
    }
    assert.equal(new Set(won).size, won.length);
    assert.equal(active.ordersWon, 3);
    assert.equal(seats(active), 8);
    assert.equal(medal(active), "Gold ticket");
    assert(active.served > idle.served * 2);
    assert(active.through > 0);
    assert.equal(
      active.spawned,
      active.served + waiting(active) + aboard(active) + active.missed,
    );
  }
});
test("daily demand and dispatch schedule are reproducible independently of the player’s line choices", () => {
  const date = "2026-11-21",
    p = dailyPlan(date);
  assert.equal(utcDay(new Date(date + "T23:59:59Z")), date);
  const a = createGame({ mode: "daily", date, city: 2, seed: 17 }),
    b = createGame({ mode: "daily", date, city: 0, seed: 93 });
  assert.deepEqual(a, b);
  assert.equal(a.seed, p.seed);
  assert.notEqual(dailyPlan("2026-11-22").seed, p.seed);
  start(a);
  start(b);
  let open = 0;
  for (let i = 0; i < SHIFT; i++) {
    if (open !== a.open) {
      open = a.open;
      design(a);
    }
    tick(a);
    tick(b);
    assert.equal(a.rng, b.rng);
    assert.equal(a.nextRider, b.nextRider);
    assert.equal(a.order?.target, b.order?.target);
  }
  assert(a.served > b.served);
  validateGame(a);
  validateGame(b);
});
test("Sunday service runs past the timer, keeps waiting riders, and finishes on request", () => {
  const s = createGame({ mode: "easy", seed: 13 });
  editLine(s, 0, []);
  start(s);
  clock(s, SHIFT + 450);
  assert.equal(s.missed, 0);
  assert.equal(s.phase, "running");
  assert(s.queues.some((q) => q.length >= 6));
  validateGame(s);
  assert(endShift(s));
  assert(!endShift(s));
  validateGame(s);
});
test("resuming a serialized shift reproduces every delivery and the same clock", () => {
  const s = createGame({ city: 1, seed: 17 });
  start(s);
  design(s);
  clock(s, 261);
  pause(s);
  const restored = validateBook(
    JSON.parse(JSON.stringify({ ...newBook(), active: s })),
  ).active;
  start(s);
  start(restored);
  clock(s, 370);
  clock(restored, 370);
  assert.deepEqual(restored, s);
});
test("record validation rejects inconsistent totals, invalid timetables and duplicate rider IDs", () => {
  const s = createGame(),
    good = () => structuredClone(s);
  const a = good();
  a.spawned++;
  assert.throws(() => validateGame(a));
  const b = good();
  b.queues[0][0].id = b.queues[0][1].id;
  assert.throws(() => validateGame(b));
  const daily = createGame({ mode: "daily", date: "2026-01-15" });
  daily.seed = 7;
  assert.throws(() => validateGame(daily));
  const book = newBook();
  book.sound = "off";
  assert.throws(() => validateBook(book));
});
test("ticket book retains personal bests for each city and the 30 latest daily dates", () => {
  const book = newBook();
  for (let i = 1; i <= 31; i++) {
    const date = "2026-10-" + String(i).padStart(2, "0"),
      s = createGame({ mode: "daily", date });
    start(s);
    clock(s, 65);
    endShift(s);
    finishRecord(book, s);
    finishRecord(book, s);
  }
  assert.equal(book.bests.length, 30);
  assert(!book.bests.some((r) => r.key.endsWith("10-01")));
  const s = createGame({ seed: 2 });
  start(s);
  clock(s, 70);
  endShift(s);
  finishRecord(book, s);
  const best = book.bests.find((r) => r.key === recordKey(s)).score;
  const retry = createGame({ seed: 3 });
  endShift(retry);
  finishRecord(book, retry);
  assert.equal(book.bests.find((r) => r.key === recordKey(s)).score, best);
  validateBook(book);
});
test("stale tabs preserve newer saves, and corrupt saves require explicit repair", () => {
  let raw = null;
  const backend = {
    getItem: () => raw,
    setItem: (_, v) => {
      raw = v;
    },
  };
  const a = createStorage(backend, "dayline", validateBook),
    b = createStorage(backend, "dayline", validateBook);
  a.load();
  b.load();
  assert(a.write(newBook()).ok);
  const latest = raw;
  assert.equal(b.write({ ...newBook(), sound: true }).reason, "conflict");
  assert.equal(raw, latest);
  raw = "{broken";
  assert.equal(a.load().error, "invalid");
  assert.equal(a.write(newBook()).reason, "invalid");
  assert.equal(raw, "{broken");
  assert(a.write(newBook(), { replaceBroken: true }).ok);
  assert.equal(
    createStorage(null, "temporary", validateBook).write(newBook()).reason,
    "unavailable",
  );
});
test("sound stays silent until enabled and unlocked; muted or unsupported platforms remain playable", async () => {
  let contexts = 0,
    started = 0,
    stopped = 0;
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  class AudioContext {
    constructor() {
      contexts++;
      this.state = "running";
      this.currentTime = 0;
    }
    createGain() {
      return { gain: param, connect() {}, disconnect() {} };
    }
    createOscillator() {
      return {
        frequency: param,
        connect() {},
        disconnect() {},
        start() {
          started++;
        },
        stop() {
          stopped++;
        },
      };
    }
  }
  const audio = createAudio({ AudioContext });
  assert(!(await audio.unlock()));
  assert.equal(contexts, 0);
  audio.setEnabled(true);
  assert(!audio.play("arrival"));
  assert(await audio.unlock());
  assert(audio.play("arrival"));
  assert.equal(started, 2);
  audio.setEnabled(false);
  assert(stopped >= 2);
  assert(!audio.play("arrival"));
  const silent = createAudio({});
  silent.setEnabled(true);
  assert(!(await silent.unlock()));
});
test("full screen uses a supported API and gracefully yields to the install guide otherwise", async () => {
  let n = 0;
  assert(
    await toggleFullscreen({
      documentElement: {
        requestFullscreen: () => {
          n++;
        },
      },
    }),
  );
  assert(
    await toggleFullscreen({
      documentElement: {},
      fullscreenElement: {},
      exitFullscreen: () => {
        n++;
      },
    }),
  );
  assert.equal(n, 2);
  assert(!(await toggleFullscreen({ documentElement: {} })));
});
