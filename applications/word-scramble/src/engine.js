/* Original Word Scramble engine. Noorullah Adel, 2026. MIT. */
import { WORDS, CATEGORIES } from "./words.js";
export function seeded(seed) {
  let s = 2166136261;
  for (const c of String(seed)) s = Math.imul(s ^ c.charCodeAt(0), 16777619);
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
export function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function scramble(word, random) {
  let letters = shuffled([...word], random);
  if (letters.join("") === word) {
    const j = letters.findIndex((x) => x !== letters[0]);
    if (j > 0) [letters[0], letters[j]] = [letters[j], letters[0]];
  }
  return letters;
}
export function createGame({
  mode = "relax",
  category = "all",
  seed = "play",
  date = new Date().toISOString().slice(0, 10),
} = {}) {
  if (
    !["relax", "rush", "daily"].includes(mode) ||
    !CATEGORIES.includes(category)
  )
    throw Error("Unknown mode or category");
  const random = seeded(mode === "daily" ? "daily:" + date : seed),
    pool = WORDS.filter(
      (w) => mode === "daily" || category === "all" || w.category === category,
    );
  const g = {
    mode,
    category: mode === "daily" ? "all" : category,
    date,
    phase: "ready",
    score: 0,
    solved: 0,
    skipped: 0,
    hints: 0,
    mistakes: 0,
    elapsed: 0,
    time: 90,
    round: 0,
    random,
    pool,
    deck: [],
    position: 0,
    current: null,
    tiles: [],
    selected: [],
    locked: 0,
    roundHints: 0,
    roundMistakes: 0,
    feedback: "",
    lastPoints: 0,
  };
  nextPuzzle(g);
  return g;
}
function nextPuzzle(g) {
  if (g.position >= g.deck.length) {
    g.deck = shuffled(g.pool, g.random);
    g.position = 0;
    if (g.deck.length > 1 && g.deck[0] === g.current)
      [g.deck[0], g.deck[1]] = [g.deck[1], g.deck[0]];
  }
  g.current = g.deck[g.position++];
  g.tiles = scramble(g.current.word, g.random);
  g.selected = [];
  g.locked = 0;
  g.roundHints = 0;
  g.roundMistakes = 0;
  g.feedback = "";
  g.round++;
}
export function startGame(g) {
  if (g.phase !== "ready") return false;
  g.phase = "running";
  return true;
}
export function pauseGame(g) {
  if (!["running", "solved"].includes(g.phase)) return false;
  g.beforePause = g.phase;
  g.phase = "paused";
  return true;
}
export function resumeGame(g) {
  if (g.phase !== "paused") return false;
  g.phase = g.beforePause || "running";
  return true;
}
export function advance(g, dt) {
  if (
    !["running", "solved"].includes(g.phase) ||
    !Number.isFinite(dt) ||
    dt <= 0
  )
    return false;
  g.elapsed += Math.min(dt, 0.25);
  if (g.mode === "rush") {
    g.time = Math.max(0, 90 - g.elapsed);
    if (g.time <= 0) {
      g.phase = "ended";
      g.feedback = "Time well spent.";
      return true;
    }
  }
  return false;
}
export function pick(g, index) {
  if (
    g.phase !== "running" ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= g.tiles.length ||
    g.selected.includes(index) ||
    g.selected.length >= g.tiles.length
  )
    return false;
  g.selected.push(index);
  g.feedback = "";
  return true;
}
export function typeLetter(g, char) {
  const i = g.tiles.findIndex(
    (c, j) => c === char.toUpperCase() && !g.selected.includes(j),
  );
  return pick(g, i);
}
export function remove(g, position = g.selected.length - 1) {
  if (
    g.phase !== "running" ||
    position < g.locked ||
    position >= g.selected.length
  )
    return false;
  g.selected.splice(position, 1);
  g.feedback = "";
  return true;
}
export function clear(g) {
  if (g.phase !== "running") return false;
  g.selected.splice(g.locked);
  g.feedback = "";
  return true;
}
export function answer(g) {
  return g.selected.map((i) => g.tiles[i]).join("");
}
export function hint(g) {
  if (g.phase !== "running" || g.locked >= g.tiles.length) return false;
  const required = g.current.word[g.locked];
  g.selected.splice(g.locked);
  const i = g.tiles.findIndex(
    (c, j) => c === required && !g.selected.includes(j),
  );
  g.selected.push(i);
  g.locked++;
  g.roundHints++;
  g.hints++;
  g.feedback = "A letter revealed. −15 from this puzzle.";
  return true;
}
export function submit(g) {
  if (g.phase !== "running") return false;
  if (g.selected.length !== g.tiles.length) {
    g.feedback = "A few letters are still looking for a place.";
    return false;
  }
  if (answer(g) !== g.current.word) {
    g.roundMistakes++;
    g.mistakes++;
    g.feedback = "Almost a word. Try moving the letters around.";
    return false;
  }
  g.lastPoints = Math.max(
    10,
    g.current.word.length * 20 +
      (g.roundHints === 0 && g.roundMistakes === 0 ? 30 : 0) -
      g.roundHints * 15,
  );
  g.score += g.lastPoints;
  g.solved++;
  g.feedback = `Beautifully untangled. +${g.lastPoints}`;
  g.phase = "solved";
  return true;
}
export function next(g) {
  if (g.phase !== "solved") return false;
  if (g.mode !== "rush" && g.round >= 5) {
    g.phase = "ended";
    return true;
  }
  nextPuzzle(g);
  g.phase = "running";
  return true;
}
export function skip(g) {
  if (g.phase !== "running") return false;
  g.skipped++;
  g.feedback = g.current.word;
  if (g.mode !== "rush" && g.round >= 5) {
    g.phase = "ended";
    return true;
  }
  nextPuzzle(g);
  return true;
}
export function result(g) {
  return {
    mode: g.mode,
    score: g.score,
    solved: g.solved,
    skipped: g.skipped,
    hints: g.hints,
    seconds: Math.floor(g.elapsed),
    date: g.date,
  };
}
