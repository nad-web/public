/* Original fictional maps and passenger briefs. Noorullah Adel · MIT. */
const station = (name, x, y, icon) => ({ name, x, y, icon });
export const LINES = [
  { code: "A", name: "Ember", color: "#c3442d" },
  { code: "B", name: "Tide", color: "#146b94" },
  { code: "C", name: "Iris", color: "#80519d" },
];
export const MODES = {
  shift: "Rush shift",
  daily: "Daily shift",
  easy: "Sunday service",
};
export const CITIES = [
  {
    name: "Mainbend",
    riverName: "River Aster",
    tone: "#cdddc3",
    water: [
      [-12, 68],
      [12, 63],
      [26, 59],
      [41, 65],
      [52, 64],
      [65, 50],
      [80, 45],
      [111, 41],
    ],
    parks: [
      [13, 28, 13, 10],
      [60, 15, 16, 10],
      [32, 80, 16, 9],
      [84, 75, 11, 9],
    ],
    hills: [
      [8, 13],
      [86, 80],
    ],
    districts: [
      ["OLD QUARTER", 25, 18],
      ["GLASS DISTRICT", 79, 12],
      ["SOUTH BANK", 58, 91],
    ],
    stations: [
      station("Old Town", 18, 42, "hall"),
      station("Central", 47, 49, "rail"),
      station("East Dock", 76, 68, "ferry"),
      station("Palm House", 64, 23, "leaf"),
      station("Museum", 25, 77, "museum"),
      station("Foundry", 86, 36, "works"),
      station("Clock Hill", 37, 20, "clock"),
      station("Arena", 53, 78, "arena"),
    ],
  },
  {
    name: "Kite Bay",
    riverName: "Kite Inlet",
    tone: "#c7dfcd",
    water: [
      [-12, 23],
      [13, 30],
      [29, 40],
      [36, 53],
      [51, 60],
      [70, 60],
      [87, 70],
      [109, 80],
    ],
    parks: [
      [20, 16, 13, 9],
      [81, 18, 13, 12],
      [14, 70, 12, 10],
      [55, 79, 11, 9],
    ],
    hills: [
      [83, 10],
      [16, 81],
    ],
    districts: [
      ["NORTH SHORE", 39, 12],
      ["SAILMAKERS", 78, 43],
      ["BAY TERRACE", 37, 91],
    ],
    stations: [
      station("Boardwalk", 18, 52, "ferry"),
      station("Market", 44, 43, "hall"),
      station("Lido", 79, 32, "arena"),
      station("Glass Pier", 66, 76, "leaf"),
      station("Boatworks", 27, 76, "works"),
      station("Observatory", 54, 21, "clock"),
      station("Gallery", 82, 55, "museum"),
      station("Tide Gate", 20, 25, "rail"),
    ],
  },
  {
    name: "Cinder Vale",
    riverName: "Silver Brook",
    tone: "#d4dec0",
    water: [
      [30, -10],
      [33, 15],
      [42, 35],
      [53, 42],
      [55, 57],
      [51, 73],
      [58, 109],
    ],
    parks: [
      [10, 24, 12, 11],
      [80, 22, 13, 12],
      [27, 80, 16, 9],
      [73, 78, 10, 8],
    ],
    hills: [
      [14, 73],
      [85, 13],
    ],
    districts: [
      ["COPPER ROW", 21, 14],
      ["UPPER VALE", 72, 12],
      ["MILL FIELDS", 75, 91],
    ],
    stations: [
      station("West Mill", 17, 45, "works"),
      station("Union", 43, 58, "rail"),
      station("Kiln Yard", 76, 65, "hall"),
      station("Orchard", 67, 27, "leaf"),
      station("Lookout", 32, 26, "clock"),
      station("Print Hall", 24, 79, "museum"),
      station("River Stage", 85, 39, "arena"),
      station("Mill Quay", 57, 79, "ferry"),
    ],
  },
];
export function hashDate(text) {
  let value = 2166136261;
  for (const char of text)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
export function utcDay(time = new Date()) {
  return time.toISOString().slice(0, 10);
}
export function dailyPlan(day = utcDay()) {
  const seed = hashDate("dayline-v1/" + day);
  return { mode: "daily", city: seed % CITIES.length, seed, date: day };
}
export function bend(a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const d = Math.min(Math.abs(dx), Math.abs(dy) * 0.78) * 0.58;
  return { x: a.x + Math.sign(dx) * d, y: a.y + (Math.sign(dy) * d) / 0.78 };
}
export function edgeLength(city, from, to) {
  const list = CITIES[city].stations,
    a = list[Math.min(from, to)],
    b = list[Math.max(from, to)],
    q = bend(a, b);
  return (
    Math.hypot(q.x - a.x, (q.y - a.y) * 0.78) +
    Math.hypot(b.x - q.x, (b.y - q.y) * 0.78)
  );
}
