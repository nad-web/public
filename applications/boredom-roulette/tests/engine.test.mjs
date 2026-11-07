import test from "node:test";
import assert from "node:assert/strict";
import { CHALLENGES } from "../src/challenges.js";
import {
  CATEGORIES,
  CATEGORY_IDS,
  initialState,
  validateChallenge,
  validateState,
  eligible,
  chooseChallenge,
  offerChallenge,
  startTimer,
  pauseTimer,
  settleTimer,
  remaining,
  completeChallenge,
  localDay,
  dayNumber,
  streakToday,
  badges,
  wheelTarget,
} from "../src/engine.js";
const day = (y, m, d, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
const fixed = day(2026, 11, 7),
  card = CHALLENGES.find((c) => c.minutes === 5);
function finish(s, now = fixed, c = card) {
  offerChallenge(s, c, "test-token");
  startTimer(s, now);
  return completeChallenge(s, CHALLENGES, now);
}
test("120 original ideas have stable unique IDs, complete content and balanced category coverage", () => {
  assert.equal(CHALLENGES.length, 120);
  assert.equal(new Set(CHALLENGES.map((c) => c.id)).size, 120);
  for (const c of CHALLENGES) {
    assert.doesNotThrow(() => validateChallenge(c));
    assert.equal(c.custom, false);
  }
  for (const c of CATEGORIES)
    assert.equal(CHALLENGES.filter((x) => x.category === c.id).length, 20);
});
test("filters enforce time, players, energy, location, categories and custom inclusion together", () => {
  const custom = { ...card, id: "custom-test", custom: true },
    cards = [...CHALLENGES, custom];
  for (const minutes of [2, 5, 15])
    for (const mode of ["solo", "together"])
      for (const energy of ["any", "gentle", "active"])
        for (const place of ["any", "inside", "outside"]) {
          const p = {
            ...initialState().settings,
            minutes,
            mode,
            energy,
            place,
          };
          for (const c of eligible(cards, p)) {
            assert(c.minutes <= minutes);
            assert(c.modes.includes(mode));
            assert(energy === "any" || c.energy === energy);
            assert(place === "any" || c.place === "any" || c.place === place);
          }
        }
  const p = { ...initialState().settings, categories: [] };
  assert.deepEqual(eligible(cards, p), []);
  p.categories = [card.category];
  p.includeCustom = false;
  assert(!eligible(cards, p).some((c) => c.custom));
  assert(eligible(cards, p).every((c) => c.category === card.category));
});
test("gentle two-minute play offers at least one idea per category for solo and together", () => {
  for (const mode of ["solo", "together"]) {
    const p = {
      ...initialState().settings,
      minutes: 2,
      mode,
      energy: "gentle",
    };
    const pool = eligible(CHALLENGES, p);
    for (const id of CATEGORY_IDS) assert(pool.some((c) => c.category === id));
  }
});
test("random selection chooses a category first, then an unseen card within it", () => {
  const s = initialState();
  s.settings.minutes = 15;
  const seq = [0.5, 0];
  const chosen = chooseChallenge(s, CHALLENGES, () => seq.shift());
  assert.equal(chosen.card.category, "reset");
  s.settings.categories = [];
  assert.equal(chooseChallenge(s, CHALLENGES), null);
});
test("matching cards do not repeat until the deck recycles, preserving seen cards outside the pool", () => {
  const s = initialState();
  s.settings.minutes = 2;
  s.seen = [card.id];
  const pool = eligible(CHALLENGES, s.settings),
    seen = new Set();
  for (let i = 0; i < pool.length; i++) {
    const pick = chooseChallenge(s, CHALLENGES, () => 0.42);
    assert(!seen.has(pick.card.id));
    assert.equal(pick.recycled, false);
    seen.add(pick.card.id);
    offerChallenge(s, pick.card, "token-" + i, {
      builtin: CHALLENGES,
      recycled: pick.recycled,
    });
  }
  const previous = s.active.id,
    pick = chooseChallenge(s, CHALLENGES, () => 0.42);
  assert.equal(pick.recycled, true);
  assert.notEqual(pick.card.id, previous);
  offerChallenge(s, pick.card, "next", { builtin: CHALLENGES, recycled: true });
  assert(s.seen.includes(card.id));
  assert(s.seen.includes(pick.card.id));
});
test("a single matching idea can be played again after its cycle", () => {
  const s = initialState(),
    only = CHALLENGES[0];
  s.settings.categories = [only.category];
  s.seen = [only.id];
  s.active = { id: only.id };
  const pick = chooseChallenge(s, [only], () => 0);
  assert.equal(pick.card.id, only.id);
  assert.equal(pick.recycled, true);
});
test("every wheel target lands the selected segment exactly under the fixed pointer", () => {
  for (const start of [0, 14, 2324, 99999])
    for (const [i, c] of CATEGORIES.entries()) {
      const end = wheelTarget(start, c.id);
      assert(end >= start + 1800);
      assert(Math.abs((end + i * 60 + 30) % 360) < 0.000001);
    }
  assert.throws(() => wheelTarget(0, "not-a-category"));
});
test("timer starts only from ready/paused, pauses accurately and survives reload", () => {
  const s = initialState();
  offerChallenge(s, card, "clock");
  assert(startTimer(s, fixed));
  assert(!startTimer(s, fixed));
  assert.equal(
    remaining(s.active, fixed + 10000),
    card.minutes * 60000 - 10000,
  );
  assert(pauseTimer(s, fixed + 10000));
  assert.equal(
    remaining(s.active, fixed + 500000),
    card.minutes * 60000 - 10000,
  );
  const restored = validateState(JSON.parse(JSON.stringify(s)), CHALLENGES);
  assert(startTimer(restored, fixed + 500000));
  assert.equal(
    remaining(restored.active, fixed + 510000),
    card.minutes * 60000 - 20000,
  );
});
test("an elapsed or clock-shifted timer remains bounded and never auto-awards a completion", () => {
  const s = initialState();
  offerChallenge(s, card, "clock");
  startTimer(s, fixed);
  assert.equal(remaining(s.active, fixed - 86400000), card.minutes * 60000);
  assert(settleTimer(s, fixed + 86400000));
  assert.equal(s.active.phase, "expired");
  assert.equal(s.total, 0);
  assert.equal(s.sparks, 0);
  assert(!settleTimer(s, fixed + 86400000));
});
test("completion is explicit and idempotent for the active challenge", () => {
  const s = initialState();
  offerChallenge(s, card, "a");
  assert.equal(completeChallenge(s, CHALLENGES, fixed), null);
  startTimer(s, fixed);
  assert(completeChallenge(s, CHALLENGES, fixed));
  assert.equal(s.total, 1);
  const points = s.sparks;
  assert.equal(completeChallenge(s, CHALLENGES, fixed), null);
  assert.equal(s.sparks, points);
  assert.equal(s.history.length, 1);
});
test("daily trio bonus is awarded exactly on the third completion and resets by local day", () => {
  const s = initialState();
  assert.equal(finish(s).bonus, 0);
  assert.equal(finish(s).bonus, 0);
  assert.equal(finish(s).bonus, 30);
  assert.equal(finish(s).bonus, 0);
  assert.equal(s.dayCounts[localDay(fixed)], 4);
  assert.equal(finish(s, day(2026, 11, 8)).bonus, 0);
  assert.equal(s.streak.current, 2);
  assert.equal(streakToday(s, day(2026, 11, 11)), 0);
  assert.equal(streakToday(s, day(2026, 11, 6)), 0);
});
test("streaks cross local midnight, do not grow twice in a day, and reset after a missed day", () => {
  const s = initialState();
  finish(s, day(2026, 3, 28, 23, 59));
  finish(s, day(2026, 3, 29, 0, 1));
  finish(s, day(2026, 3, 29, 12));
  assert.equal(s.streak.current, 2);
  finish(s, day(2026, 3, 30));
  assert.equal(s.streak.current, 3);
  assert(badges(s).find((b) => b.name === "Three-day streak").earned);
  finish(s, day(2026, 4, 2));
  assert.equal(s.streak.current, 1);
  assert.equal(s.streak.best, 3);
});
test("calendar validation rejects impossible dates and uses whole calendar days", () => {
  assert(Number.isNaN(dayNumber("2026-02-30")));
  assert(Number.isNaN(dayNumber("__proto__")));
  assert.equal(dayNumber("2026-11-08") - dayNumber("2026-11-07"), 1);
});
test("validated backups round-trip custom ideas, favorites, active steps and scores", () => {
  const s = initialState();
  finish(s);
  const custom = validateChallenge(
    { ...card, id: "custom-example", title: "Our tiny tradition" },
    true,
  );
  s.custom.push(custom);
  s.favorites.push(custom.id);
  offerChallenge(s, custom, "custom-token");
  s.active.checked = [0];
  const restored = validateState(JSON.parse(JSON.stringify(s)), CHALLENGES);
  assert.deepEqual(restored, s);
});
test("malformed imports, invalid counters, oversized customs and duplicate IDs are rejected", () => {
  for (const mutate of [
    (s) => (s.sparks = Infinity),
    (s) => (s.settings.minutes = 1),
    (s) => (s.favorites = ["missing"]),
    (s) => (s.streak.last = "2026-02-30"),
    (s) => (s.custom = Array(41).fill({ ...card, id: "custom-x" })),
    (s) =>
      (s.custom = [
        { ...card, id: "custom-x" },
        { ...card, id: "custom-x" },
      ]),
  ]) {
    const s = initialState();
    mutate(s);
    assert.throws(() => validateState(s, CHALLENGES));
  }
  assert.throws(() =>
    validateChallenge({ ...card, id: "custom-test", steps: [" "] }, true),
  );
  assert.throws(() =>
    validateChallenge(
      { ...card, id: "custom-test", title: "x".repeat(73) },
      true,
    ),
  );
});
test("journal and daily storage are bounded while totals and milestones remain cumulative", () => {
  const s = initialState();
  for (let i = 0; i < 45; i++) finish(s, fixed, CHALLENGES[i % 120]);
  assert.equal(s.history.length, 40);
  assert.equal(s.total, 45);
  assert(badges(s).find((b) => b.name === "Tiny adventurer").earned);
  assert.doesNotThrow(() => validateState(s, CHALLENGES));
});
