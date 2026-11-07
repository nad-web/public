/* Original game logic. Copyright (c) 2026 Noorullah Adel. MIT. */
export const CATEGORIES = [
  {
    id: "create",
    name: "Create",
    verb: "Make a little magic",
    color: "#ffbd98",
    mark: "✷",
  },
  {
    id: "move",
    name: "Move",
    verb: "Find your rhythm",
    color: "#b8dfc8",
    mark: "↗",
  },
  {
    id: "explore",
    name: "Explore",
    verb: "Notice something new",
    color: "#d9c4ed",
    mark: "⌁",
  },
  {
    id: "reset",
    name: "Reset",
    verb: "Make a little room",
    color: "#f5df8d",
    mark: "☼",
  },
  {
    id: "learn",
    name: "Learn",
    verb: "Follow your curiosity",
    color: "#b8cff4",
    mark: "✧",
  },
  {
    id: "connect",
    name: "Connect",
    verb: "Share a tiny moment",
    color: "#efbfd7",
    mark: "♡",
  },
];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
const MAX = 10000000;
const int = (n, lo = 0, hi = MAX) => Number.isInteger(n) && n >= lo && n <= hi;
const text = (s, max) =>
  typeof s === "string" && s.trim().length > 0 && s.length <= max;
export function localDay(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dayNumber(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
  const [y, m, d] = day.split("-").map(Number),
    date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
    ? date.getTime() / 86400000
    : NaN;
}
export function initialState() {
  return {
    schema: 1,
    settings: {
      minutes: 5,
      mode: "solo",
      energy: "any",
      place: "any",
      categories: [...CATEGORY_IDS],
      includeCustom: true,
      sound: false,
      theme: "light",
    },
    custom: [],
    favorites: [],
    seen: [],
    active: null,
    history: [],
    dayCounts: {},
    counts: Object.fromEntries(CATEGORY_IDS.map((c) => [c, 0])),
    total: 0,
    sparks: 0,
    streak: { last: "", current: 0, best: 0 },
  };
}
export function validateChallenge(c, custom = false) {
  if (
    !c ||
    typeof c !== "object" ||
    !text(c.id, 80) ||
    !/^[a-z0-9-]+$/.test(c.id) ||
    (custom && !c.id.startsWith("custom-")) ||
    !CATEGORY_IDS.includes(c.category) ||
    !text(c.title, 72) ||
    ![2, 5, 15].includes(c.minutes) ||
    !["gentle", "active"].includes(c.energy) ||
    !["any", "inside", "outside"].includes(c.place) ||
    !Array.isArray(c.modes) ||
    !c.modes.length ||
    c.modes.length > 2 ||
    !c.modes.every((m) => ["solo", "together"].includes(m)) ||
    !text(c.materials, 100) ||
    !Array.isArray(c.steps) ||
    c.steps.length < 1 ||
    c.steps.length > 3 ||
    !c.steps.every((s) => text(s, 190))
  )
    throw Error(
      "Invalid challenge. Use a title, 1–3 short steps and the available options.",
    );
  return {
    id: c.id,
    category: c.category,
    title: c.title.trim(),
    minutes: c.minutes,
    energy: c.energy,
    place: c.place,
    modes: [...new Set(c.modes)],
    materials: c.materials.trim(),
    steps: c.steps.map((s) => s.trim()),
    custom,
  };
}
export function validateState(raw, builtin) {
  if (!raw || raw.schema !== 1 || typeof raw !== "object")
    throw Error("This is not a supported Boredom Roulette record.");
  const s = initialState(),
    p = raw.settings;
  if (
    !p ||
    ![2, 5, 15].includes(p.minutes) ||
    !["solo", "together"].includes(p.mode) ||
    !["any", "gentle", "active"].includes(p.energy) ||
    !["any", "inside", "outside"].includes(p.place) ||
    !Array.isArray(p.categories) ||
    !p.categories.every((c) => CATEGORY_IDS.includes(c)) ||
    !["light", "dark"].includes(p.theme) ||
    typeof p.sound !== "boolean" ||
    typeof p.includeCustom !== "boolean"
  )
    throw Error("The saved settings are not valid.");
  s.settings = {
    minutes: p.minutes,
    mode: p.mode,
    energy: p.energy,
    place: p.place,
    categories: [...new Set(p.categories)],
    includeCustom: p.includeCustom,
    sound: p.sound,
    theme: p.theme,
  };
  if (!Array.isArray(raw.custom) || raw.custom.length > 40)
    throw Error("A backup can contain up to 40 custom challenges.");
  s.custom = raw.custom.map((c) => validateChallenge(c, true));
  const all = [...builtin, ...s.custom],
    ids = new Set(all.map((c) => c.id));
  if (ids.size !== all.length) throw Error("Duplicate challenge IDs.");
  for (const key of ["favorites", "seen"]) {
    if (
      !Array.isArray(raw[key]) ||
      raw[key].length > all.length ||
      !raw[key].every((id) => typeof id === "string" && ids.has(id))
    )
      throw Error("The saved challenge list is not valid.");
    s[key] = [...new Set(raw[key])];
  }
  if (
    !int(raw.total) ||
    !int(raw.sparks, 0, MAX * 100) ||
    !raw.counts ||
    !CATEGORY_IDS.every((c) => int(raw.counts[c]))
  )
    throw Error("The saved score is not valid.");
  s.total = raw.total;
  s.sparks = raw.sparks;
  s.counts = Object.fromEntries(CATEGORY_IDS.map((c) => [c, raw.counts[c]]));
  if (
    !raw.streak ||
    !int(raw.streak.current) ||
    !int(raw.streak.best) ||
    raw.streak.best < raw.streak.current ||
    (raw.streak.last !== "" && !Number.isFinite(dayNumber(raw.streak.last)))
  )
    throw Error("The saved streak is not valid.");
  s.streak = {
    last: raw.streak.last,
    current: raw.streak.current,
    best: raw.streak.best,
  };
  if (
    !raw.dayCounts ||
    typeof raw.dayCounts !== "object" ||
    Array.isArray(raw.dayCounts) ||
    Object.keys(raw.dayCounts).length > 370
  )
    throw Error("Invalid daily records.");
  for (const [day, count] of Object.entries(raw.dayCounts)) {
    if (!Number.isFinite(dayNumber(day)) || !int(count))
      throw Error("Invalid daily records.");
    s.dayCounts[day] = count;
  }
  if (!Array.isArray(raw.history) || raw.history.length > 40)
    throw Error("Invalid recent adventures.");
  s.history = raw.history.map((h) => {
    if (
      !h ||
      !text(h.title, 72) ||
      !CATEGORY_IDS.includes(h.category) ||
      !text(h.id, 80) ||
      !Number.isFinite(dayNumber(h.day)) ||
      !int(h.points, 0, 100) ||
      !int(h.at, 0, 8640000000000000)
    )
      throw Error("Invalid recent adventures.");
    return {
      id: h.id,
      title: h.title,
      category: h.category,
      day: h.day,
      points: h.points,
      at: h.at,
    };
  });
  if (raw.active !== null) {
    const a = raw.active,
      card = all.find((c) => c.id === a?.id);
    if (
      !card ||
      !text(a.token, 100) ||
      !["ready", "running", "paused", "expired", "done"].includes(a.phase) ||
      !Number.isFinite(a.remaining) ||
      a.remaining < 0 ||
      a.remaining > card.minutes * 60000 ||
      !Number.isFinite(a.deadline) ||
      a.deadline < 0 ||
      !Array.isArray(a.checked) ||
      !a.checked.every((i) => int(i, 0, card.steps.length - 1)) ||
      !int(a.reward, 0, 100)
    )
      throw Error("The saved active challenge is not valid.");
    s.active = {
      id: a.id,
      token: a.token,
      phase: a.phase,
      remaining: a.remaining,
      deadline: a.deadline,
      checked: [...new Set(a.checked)],
      reward: a.reward,
    };
  }
  return s;
}
export function allChallenges(s, builtin) {
  return [...builtin, ...s.custom];
}
export function eligible(cards, p) {
  return cards.filter(
    (c) =>
      p.categories.includes(c.category) &&
      c.minutes <= p.minutes &&
      c.modes.includes(p.mode) &&
      (p.energy === "any" || c.energy === p.energy) &&
      (p.place === "any" || c.place === "any" || c.place === p.place) &&
      (p.includeCustom || !c.custom),
  );
}
function index(length, random) {
  const r = random();
  return Math.min(
    length - 1,
    Math.max(0, Math.floor((Number.isFinite(r) ? r : 0) * length)),
  );
}
export function chooseChallenge(s, builtin, random = Math.random) {
  const candidates = eligible(allChallenges(s, builtin), s.settings);
  if (!candidates.length) return null;
  let unseen = candidates.filter((c) => !s.seen.includes(c.id));
  const recycled = !unseen.length;
  if (recycled) unseen = candidates.filter((c) => c.id !== s.active?.id);
  if (!unseen.length) unseen = candidates;
  const groups = CATEGORY_IDS.map((id) =>
    unseen.filter((c) => c.category === id),
  ).filter((g) => g.length);
  const group = groups[index(groups.length, random)],
    card = group[index(group.length, random)];
  return { card, recycled };
}
export function offerChallenge(
  s,
  card,
  token,
  { recycled = false, builtin = [] } = {},
) {
  if (recycled) {
    const pool = new Set(
      eligible(allChallenges(s, builtin), s.settings).map((c) => c.id),
    );
    s.seen = s.seen.filter((id) => !pool.has(id));
  }
  s.seen = [...new Set([...s.seen, card.id])];
  s.active = {
    id: card.id,
    token,
    phase: "ready",
    remaining: card.minutes * 60000,
    deadline: 0,
    checked: [],
    reward: 0,
  };
}
export function remaining(a, now = Date.now()) {
  if (!a || a.phase === "done") return 0;
  return a.phase === "running"
    ? Math.max(0, Math.min(a.remaining, a.deadline - now))
    : a.remaining;
}
export function startTimer(s, now = Date.now()) {
  const a = s.active;
  if (!a || !["ready", "paused"].includes(a.phase)) return false;
  a.phase = "running";
  a.deadline = now + a.remaining;
  return true;
}
export function pauseTimer(s, now = Date.now()) {
  const a = s.active;
  if (!a || a.phase !== "running") return false;
  a.remaining = remaining(a, now);
  a.phase = a.remaining > 0 ? "paused" : "expired";
  a.deadline = 0;
  return true;
}
export function settleTimer(s, now = Date.now()) {
  if (s.active?.phase === "running" && remaining(s.active, now) === 0) {
    s.active.phase = "expired";
    s.active.remaining = 0;
    s.active.deadline = 0;
    return true;
  }
  return false;
}
export function completeChallenge(s, builtin, now = Date.now()) {
  const a = s.active,
    card = allChallenges(s, builtin).find((c) => c.id === a?.id);
  if (!card || !["running", "paused", "expired"].includes(a.phase)) return null;
  const day = localDay(now),
    old = s.dayCounts[day] || 0,
    bonus = old === 2 ? 30 : 0,
    points = card.minutes === 2 ? 10 : card.minutes === 5 ? 20 : 35;
  s.dayCounts[day] = old + 1;
  const recent = Object.keys(s.dayCounts).sort().slice(-370);
  s.dayCounts = Object.fromEntries(recent.map((d) => [d, s.dayCounts[d]]));
  if (s.streak.last !== day) {
    s.streak.current =
      dayNumber(day) - dayNumber(s.streak.last) === 1
        ? s.streak.current + 1
        : 1;
    s.streak.last = day;
    s.streak.best = Math.max(s.streak.best, s.streak.current);
  }
  s.total = Math.min(MAX, s.total + 1);
  s.sparks = Math.min(MAX * 100, s.sparks + points + bonus);
  s.counts[card.category] = Math.min(MAX, s.counts[card.category] + 1);
  s.history.unshift({
    id: card.id,
    title: card.title,
    category: card.category,
    day,
    points: points + bonus,
    at: now,
  });
  s.history = s.history.slice(0, 40);
  a.phase = "done";
  a.remaining = 0;
  a.deadline = 0;
  a.reward = points + bonus;
  return { points, bonus, total: points + bonus, card };
}
export function streakToday(s, now = Date.now()) {
  const days = dayNumber(localDay(now)) - dayNumber(s.streak.last);
  return days >= 0 && days <= 1 ? s.streak.current : 0;
}
export function badges(s) {
  return [
    {
      name: "First spark",
      description: "Complete your first challenge",
      earned: s.total >= 1,
    },
    {
      name: "Tiny adventurer",
      description: "Complete 10 challenges",
      earned: s.total >= 10,
    },
    {
      name: "Curious soul",
      description: "Try all six categories",
      earned: CATEGORY_IDS.every((c) => s.counts[c] > 0),
    },
    {
      name: "Three-day streak",
      description: "Complete a challenge on 3 days in a row",
      earned: s.streak.best >= 3,
    },
  ];
}
export function wheelTarget(current, category, turns = 5) {
  const i = CATEGORY_IDS.indexOf(category);
  if (i < 0) throw Error("Unknown wheel category");
  const end = ((-(i * 60 + 30) % 360) + 360) % 360,
    residue = ((current % 360) + 360) % 360;
  return current + turns * 360 + ((end - residue + 360) % 360);
}
