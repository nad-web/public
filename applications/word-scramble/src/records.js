/* Validated app-local records. Noorullah Adel, 2026. MIT. */
import { createStorage } from "./storage.js";
const modes = { word: ["relax", "rush", "daily"], stack: ["classic", "chill"] };
const num = (n) => Number.isSafeInteger(n) && n >= 0 && n <= 1e9;
export function defaults(kind) {
  return {
    version: 1,
    kind,
    prefs: { sound: false, effects: true },
    best: Object.fromEntries(modes[kind].map((m) => [m, 0])),
    plays: 0,
    recent: [],
    last: null,
  };
}
export function validate(value, kind) {
  if (
    !value ||
    value.version !== 1 ||
    value.kind !== kind ||
    !value.prefs ||
    typeof value.prefs.sound !== "boolean" ||
    typeof value.prefs.effects !== "boolean" ||
    !value.best ||
    !modes[kind].every((m) => num(value.best[m])) ||
    !num(value.plays) ||
    !Array.isArray(value.recent) ||
    value.recent.length > 8
  )
    throw Error("Invalid game record");
  if (
    value.last !== null &&
    (!value.last ||
      typeof value.last.id !== "string" ||
      value.last.id.length > 160 ||
      typeof value.last.done !== "boolean")
  )
    throw Error("Invalid run marker");
  for (const r of value.recent) {
    if (
      !r ||
      !modes[kind].includes(r.mode) ||
      !num(r.score) ||
      !num(r.seconds) ||
      typeof r.id !== "string" ||
      r.id.length > 160 ||
      !Number.isSafeInteger(r.at) ||
      r.at < 0 ||
      r.at > 8.64e15
    )
      throw Error("Invalid history");
    const keys =
      kind === "word"
        ? ["solved", "skipped", "hints"]
        : ["height", "perfect", "streak"];
    if (!keys.every((k) => num(r[k]))) throw Error("Invalid result");
    if (
      kind === "word" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
        !Number.isFinite(Date.parse(r.date)) ||
        new Date(r.date).toISOString().slice(0, 10) !== r.date)
    )
      throw Error("Invalid daily date");
  }
  return structuredClone(value);
}
export function addResult(record, id, result, done, now = Date.now()) {
  if (
    !modes[record.kind].includes(result.mode) ||
    !num(result.score) ||
    !num(result.seconds) ||
    typeof id !== "string" ||
    id.length > 160 ||
    typeof done !== "boolean"
  )
    throw Error("Invalid result");
  const keys =
    record.kind === "word"
      ? ["solved", "skipped", "hints"]
      : ["height", "perfect", "streak"];
  if (!keys.every((k) => num(result[k]))) throw Error("Invalid result counts");
  if (record.last?.id === id && record.last.done) return false;
  if (record.last?.id !== id) {
    record.plays++;
    record.last = { id, done: false };
  }
  const best = record.kind === "word" ? result.score : result.height;
  record.best[result.mode] = Math.max(record.best[result.mode], best);
  if (done) {
    record.last.done = true;
    record.recent.unshift({ ...result, id, at: now });
    record.recent = record.recent.slice(0, 8);
  }
  return true;
}
export function createRecords(kind, path, onConflict = () => {}) {
  let backend;
  try {
    backend = localStorage;
  } catch {}
  const storage = createStorage(
      backend,
      `noorullah:${kind === "word" ? "word-scramble" : "stack-tower"}:v1:${path}`,
      (v) => validate(v, kind),
    ),
    loaded = storage.load();
  let data = loaded.state || defaults(kind),
    problem = loaded.error,
    conflict = false;
  function write(change, replaceBroken = false) {
    if (conflict) return false;
    const next = structuredClone(data);
    if (change(next) === false) return false;
    validate(next, kind);
    const r = storage.write(next, { replaceBroken });
    if (!r.ok && r.reason === "conflict") {
      conflict = true;
      onConflict();
      return false;
    }
    data = next;
    problem = r.ok ? null : r.reason;
    return true;
  }
  return {
    get data() {
      return data;
    },
    get problem() {
      return problem;
    },
    get conflicted() {
      return conflict;
    },
    key: storage.key,
    write,
    save: (id, r, done) => write((d) => addResult(d, id, r, done)),
    reset: () =>
      write((d) => Object.assign(d, defaults(kind), { prefs: d.prefs }), true),
    markConflict() {
      if (!conflict) {
        conflict = true;
        onConflict();
      }
    },
    raw: () => storage.raw,
  };
}
