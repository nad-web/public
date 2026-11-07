/* Copyright (c) 2026 Noorullah Adel. Local, validated records. MIT. */
const KEY = "noorullah:rooftop-cat:v1";
const number = (v) =>
  Number.isSafeInteger(v) && v >= 0 && v <= 1_000_000_000 ? v : 0;
export function defaults() {
  return {
    version: 1,
    prefs: {
      sound: false,
      sky: "sunset",
      cat: "ginger",
      motion: true,
      mode: "cozy",
    },
    best: { cozy: 0, chase: 0, daily: {} },
    stats: { runs: 0, fish: 0, distance: 0 },
    recent: [],
  };
}
export function validateRecord(value) {
  const record = defaults();
  if (!value || typeof value !== "object" || value.version !== 1) return record;
  for (const field of ["sound", "motion"])
    if (typeof value.prefs?.[field] === "boolean")
      record.prefs[field] = value.prefs[field];
  for (const [field, allowed] of Object.entries({
    sky: ["sunset", "moonlight"],
    cat: ["ginger", "midnight", "cloud"],
    mode: ["cozy", "chase", "daily"],
  }))
    if (allowed.includes(value.prefs?.[field]))
      record.prefs[field] = value.prefs[field];
  for (const field of ["cozy", "chase"])
    record.best[field] = number(value.best?.[field]);
  for (const [date, score] of Object.entries(
    value.best?.daily && typeof value.best.daily === "object"
      ? value.best.daily
      : {},
  )
    .filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort()
    .slice(-30))
    record.best.daily[date] = number(score);
  for (const field of ["runs", "fish", "distance"])
    record.stats[field] = number(value.stats?.[field]);
  record.recent = Array.isArray(value.recent)
    ? value.recent
        .filter((v) => v && typeof v.id === "string" && v.id.length < 100)
        .slice(-128)
        .map((v) => ({
          id: v.id,
          fish: number(v.fish),
          distance: number(v.distance),
        }))
    : [];
  return record;
}
export function createRecords({
  platform = globalThis,
  onWarning = () => {},
} = {}) {
  let memory = defaults(),
    warned = false,
    persistent = true;
  function warn() {
    if (!warned) {
      warned = true;
      onWarning(
        "Scores are kept for this visit only. Browser storage is unavailable or full.",
      );
    }
  }
  function read() {
    if (persistent)
      try {
        const raw = platform.localStorage.getItem(KEY);
        if (raw) memory = validateRecord(JSON.parse(raw));
      } catch {
        persistent = false;
        warn();
      }
    return JSON.parse(JSON.stringify(memory));
  }
  function write(record) {
    memory = validateRecord(record);
    if (persistent)
      try {
        platform.localStorage.setItem(KEY, JSON.stringify(memory));
      } catch {
        persistent = false;
        warn();
      }
    return JSON.parse(JSON.stringify(memory));
  }
  return {
    read,
    preferences(patch) {
      const latest = read();
      return write({ ...latest, prefs: { ...latest.prefs, ...patch } });
    },
    saveRun(id, result) {
      const latest = read();
      if (
        typeof id !== "string" ||
        !id ||
        id.length >= 100 ||
        !["cozy", "chase", "daily"].includes(result.mode)
      )
        return latest;
      const previous = latest.recent.find((r) => r.id === id),
        score = number(result.score);
      if (result.mode === "daily" && /^\d{4}-\d{2}-\d{2}$/.test(result.date))
        latest.best.daily[result.date] = Math.max(
          latest.best.daily[result.date] || 0,
          score,
        );
      else if (result.mode !== "daily")
        latest.best[result.mode] = Math.max(latest.best[result.mode], score);
      latest.stats.runs = Math.min(
        1_000_000_000,
        latest.stats.runs + (previous ? 0 : 1),
      );
      latest.stats.fish = Math.min(
        1_000_000_000,
        latest.stats.fish +
          Math.max(0, number(result.fishCount) - (previous?.fish || 0)),
      );
      latest.stats.distance = Math.min(
        1_000_000_000,
        latest.stats.distance +
          Math.max(0, number(result.distance) - (previous?.distance || 0)),
      );
      latest.recent = latest.recent.filter((r) => r.id !== id);
      latest.recent.push({
        id,
        fish: Math.max(previous?.fish || 0, number(result.fishCount)),
        distance: Math.max(previous?.distance || 0, number(result.distance)),
      });
      return write(latest);
    },
    reset() {
      return write(defaults());
    },
    key: KEY,
  };
}
