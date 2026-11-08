import test from "node:test";
import assert from "node:assert/strict";
import { WORDS, CATEGORIES } from "../src/words.js";
import {
  createGame,
  startGame,
  pauseGame,
  resumeGame,
  advance,
  pick,
  typeLetter,
  remove,
  clear,
  hint,
  submit,
  next,
  skip,
  result,
  scramble,
  seeded,
  answer,
} from "../src/engine.js";
function game(options) {
  const g = createGame(options);
  startGame(g);
  return g;
}
function solve(g) {
  for (const c of g.current.word.slice(g.selected.length))
    assert(typeLetter(g, c));
  assert(submit(g));
}
test("original dictionary is unique, playable and has complete clues/categories", () => {
  assert(WORDS.length >= 90);
  assert.equal(new Set(WORDS.map((w) => w.word)).size, WORDS.length);
  for (const w of WORDS) {
    assert(/^[A-Z]{3,9}$/.test(w.word), w.word);
    assert(CATEGORIES.includes(w.category));
    assert(w.clue.length > 12);
  }
});
test("scrambles retain every repeated letter and never show the answer unchanged", () => {
  for (let seed = 0; seed < 100; seed++)
    for (const { word } of WORDS) {
      const letters = scramble(word, seeded(seed));
      assert.equal([...letters].sort().join(""), [...word].sort().join(""));
      assert.notEqual(letters.join(""), word);
    }
});
test("daily five is deterministic by UTC date, independent of mode filter and random session seed", () => {
  const a = game({
      mode: "daily",
      date: "2026-11-08",
      seed: "a",
      category: "animals",
    }),
    b = game({
      mode: "daily",
      date: "2026-11-08",
      seed: "b",
      category: "creative",
    }),
    seen = [];
  for (let i = 0; i < 5; i++) {
    assert.equal(a.current.word, b.current.word);
    seen.push(a.current.word);
    skip(a);
    skip(b);
  }
  assert.equal(new Set(seen).size, 5);
  assert.equal(a.phase, "ended");
  const c = game({ mode: "daily", date: "2026-11-09" });
  assert.notDeepEqual(c.deck.slice(0, 5), a.deck.slice(0, 5));
});
test("category deck stays in its category without repeats inside one deck", () => {
  const g = game({ category: "animals", mode: "rush", seed: "category" }),
    seen = [];
  for (let i = 0; i < g.pool.length; i++) {
    assert.equal(g.current.category, "animals");
    seen.push(g.current.word);
    skip(g);
  }
  assert.equal(new Set(seen).size, g.pool.length);
  assert.notEqual(g.current.word, seen.at(-1));
});
test("tiles are single-use, positions remove correctly and duplicate letters have their own identity", () => {
  const g = game();
  g.current = { word: "LETTER", clue: "", category: "all" };
  g.tiles = [..."TETLER"];
  g.selected = [];
  assert(typeLetter(g, "T"));
  assert(typeLetter(g, "T"));
  assert(!typeLetter(g, "T"));
  assert.equal(g.selected.length, 2);
  assert(!pick(g, g.selected[0]));
  assert(remove(g, 0));
  assert.equal(answer(g), "T");
  assert(!pick(g, -1));
  assert(!pick(g, 99));
});
test("wrong submissions keep letters, count a mistake and cannot earn points", () => {
  const g = game();
  for (let i = 0; i < g.tiles.length; i++) pick(g, i);
  assert(!submit(g));
  assert.equal(g.score, 0);
  assert.equal(g.mistakes, 1);
  clear(g);
  solve(g);
  assert.equal(g.score, g.current.word.length * 20);
  assert(!submit(g));
});
test("reveal locks a valid prefix, clears loose letters and applies the documented puzzle cost", () => {
  const g = game();
  pick(g, 0);
  assert(hint(g));
  assert.equal(answer(g), g.current.word[0]);
  assert.equal(g.locked, 1);
  assert(!remove(g, 0));
  clear(g);
  assert.equal(g.selected.length, 1);
  solve(g);
  assert.equal(g.score, Math.max(10, g.current.word.length * 20 - 15));
});
test("revealing all letters remains a valid low-award solve and hints cannot exceed the word", () => {
  const g = game();
  for (let i = 0; i < g.tiles.length; i++) assert(hint(g));
  assert(!hint(g));
  assert(submit(g));
  assert.equal(g.score, Math.max(10, g.current.word.length * 5));
});
test("Relax ends only after its fifth puzzle; skip earns no score and solved next cannot double-count", () => {
  const g = game({ mode: "relax" });
  for (let i = 0; i < 5; i++) {
    solve(g);
    const old = g.score;
    assert(!submit(g));
    assert.equal(g.score, old);
    assert(next(g));
  }
  assert.equal(g.phase, "ended");
  assert.equal(g.solved, 5);
  assert(!next(g));
  assert(!skip(g));
  const s = game();
  for (let i = 0; i < 5; i++) skip(s);
  assert.equal(s.score, 0);
  assert.equal(s.skipped, 5);
  assert.equal(s.phase, "ended");
});
test("Rush uses ninety active seconds including solved feedback, with explicit pause and no hidden-time catch-up", () => {
  const g = game({ mode: "rush" });
  for (let i = 0; i < 120; i++) advance(g, 0.25);
  assert.equal(g.time, 60);
  solve(g);
  advance(g, 0.25);
  assert.equal(g.phase, "solved");
  assert.equal(g.time, 59.75);
  assert(pauseGame(g));
  advance(g, 40);
  assert.equal(g.time, 59.75);
  assert(resumeGame(g));
  assert.equal(g.phase, "solved");
  next(g);
  for (let i = 0; i < 239; i++) advance(g, 0.25);
  assert.equal(g.phase, "ended");
  assert.equal(g.time, 0);
  assert(!pick(g, 0));
});
test("invalid duration cannot corrupt clock or state and large gaps are bounded", () => {
  const g = game({ mode: "rush" });
  for (const n of [NaN, Infinity, -1, 0]) advance(g, n);
  assert.equal(g.time, 90);
  advance(g, 100);
  assert.equal(g.time, 89.75);
  assert.throws(() => createGame({ mode: "unknown" }));
  assert.throws(() => createGame({ category: "unknown" }));
  assert.equal(result(g).mode, "rush");
});
