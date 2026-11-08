/* Validated local score snapshots. Copyright (c) 2026 Noorullah Adel. MIT. */
import { MODES } from "./engine.js";
const cap = 1000000000;
const valid = (n) => Number.isSafeInteger(n) && n >= 0 && n <= cap;
export function defaults() {
  return {
    version: 1,
    prefs: {
      mode: "classic",
      skin: "fern",
      theme: "auto",
      sound: false,
      effects: true,
    },
    best: { classic: 0, chill: 0, sprint: 0 },
    stats: {
      runs: 0,
      meters: 0,
      jumps: 0,
      cleared: 0,
      ducked: 0,
      bestMeters: 0,
    },
    recent: [],
    lastRun: null,
  };
}
export function validateRecord(raw) {
  if (!raw || raw.version !== 1) throw Error("Unsupported score record");
  const r = defaults(),
    p = raw.prefs;
  if (
    !p ||
    !Object.hasOwn(MODES, p.mode) ||
    !["fern", "ember", "midnight"].includes(p.skin) ||
    !["auto", "paper", "night"].includes(p.theme) ||
    typeof p.sound !== "boolean" ||
    typeof p.effects !== "boolean"
  )
    throw Error("Invalid game preferences");
  r.prefs = {
    mode: p.mode,
    skin: p.skin,
    theme: p.theme,
    sound: p.sound,
    effects: p.effects,
  };
  for (const k of Object.keys(r.best)) {
    if (!valid(raw.best?.[k])) throw Error("Invalid best score");
    r.best[k] = raw.best[k];
  }
  for (const k of Object.keys(r.stats)) {
    if (!valid(raw.stats?.[k])) throw Error("Invalid lifetime record");
    r.stats[k] = raw.stats[k];
  }
  if (!Array.isArray(raw.recent) || raw.recent.length > 10)
    throw Error("Invalid recent runs");
  r.recent = raw.recent.map((x) => {
    if (
      !x ||
      typeof x.id !== "string" ||
      !x.id ||
      x.id.length > 100 ||
      !Object.hasOwn(MODES, x.mode) ||
      !["collision", "finished"].includes(x.reason) ||
      !["score", "meters", "seconds", "at"].every(
        (k) =>
          Number.isSafeInteger(x[k]) &&
          x[k] >= 0 &&
          x[k] <= (k === "at" ? 8640000000000000 : cap),
      )
    )
      throw Error("Invalid recent run");
    return {
      id: x.id,
      mode: x.mode,
      score: x.score,
      meters: x.meters,
      seconds: x.seconds,
      reason: x.reason,
      at: x.at,
    };
  });
  if (raw.lastRun !== null) {
    const x = raw.lastRun;
    if (
      !x ||
      typeof x.id !== "string" ||
      !x.id ||
      x.id.length > 100 ||
      typeof x.done !== "boolean" ||
      !["meters", "jumps", "cleared", "ducked"].every((k) => valid(x[k]))
    )
      throw Error("Invalid partial run");
    r.lastRun = {
      id: x.id,
      meters: x.meters,
      jumps: x.jumps,
      cleared: x.cleared,
      ducked: x.ducked,
      done: x.done,
    };
  }
  return r;
}
export function recordRun(record, id, result, now = Date.now()) {
  if (
    typeof id !== "string" ||
    !id ||
    id.length > 100 ||
    !Object.hasOwn(MODES, result.mode) ||
    typeof result.done !== "boolean" ||
    (result.done && !["collision", "finished"].includes(result.reason)) ||
    !["score", "meters", "seconds", "jumps", "cleared", "ducked"].every((k) =>
      valid(result[k]),
    )
  )
    return false;
  const old = record.lastRun?.id === id ? record.lastRun : null;
  if (old?.done) return false;
  if (!old) record.stats.runs = Math.min(cap, record.stats.runs + 1);
  for (const k of ["meters", "jumps", "cleared", "ducked"])
    record.stats[k] = Math.min(
      cap,
      record.stats[k] + Math.max(0, result[k] - (old?.[k] || 0)),
    );
  record.best[result.mode] = Math.max(record.best[result.mode], result.score);
  record.stats.bestMeters = Math.max(record.stats.bestMeters, result.meters);
  record.lastRun = {
    id,
    meters: Math.max(old?.meters || 0, result.meters),
    jumps: Math.max(old?.jumps || 0, result.jumps),
    cleared: Math.max(old?.cleared || 0, result.cleared),
    ducked: Math.max(old?.ducked || 0, result.ducked),
    done: result.done === true,
  };
  if (result.done === true) {
    record.recent.unshift({
      id,
      mode: result.mode,
      score: result.score,
      meters: result.meters,
      seconds: result.seconds,
      reason: result.reason,
      at: now,
    });
    record.recent = record.recent.slice(0, 10);
  }
  return true;
}
