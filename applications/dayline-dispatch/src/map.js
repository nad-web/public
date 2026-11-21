/* Original illustrative street maps and train diagrams. Noorullah Adel · MIT. */
import { CITIES, LINES, bend } from "./cities.js";
const ns = "http://www.w3.org/2000/svg";
const fmt = (n) => String(Math.round(n * 100) / 100);
export const glyphs = {
  hall: '<path d="M2 10 10 3l8 7M4 9v8h12V9M8 17v-5h4v5"/>',
  rail: '<rect x="4" y="2" width="12" height="13" rx="3"/><path d="M5 7h10M6 18l2-3m6 3-2-3M7 11h1m4 0h1"/>',
  ferry:
    '<path d="m2 12 8-3 8 3-3 4H5zM7 10V6h6v4m-3-4V3M2 18q2-2 4 0 2-2 4 0 2-2 4 0 2-2 4 0"/>',
  leaf: '<path d="M4 14C1 6 9 4 17 3c1 8-4 14-10 12M3 18l10-11"/>',
  museum: '<path d="m2 7 8-4 8 4zM4 9v6m4-6v6m4-6v6m4-6v6M2 17h16"/>',
  works: '<path d="M2 17v-6l6-4v4l5-3V4h3l1 13zM6 14h1m3 0h1"/>',
  clock: '<circle cx="10" cy="10" r="7"/><path d="M10 5v5l3 2"/>',
  arena: '<path d="M2 8q8-8 16 0v5q-8 8-16 0zM2 8q8 7 16 0M6 12v3m8-3v3"/>',
};
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
function smooth(points) {
  const out = ["M", points[0][0], points[0][1]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1];
    out.push("Q", ...a, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  out.push("L", ...points[points.length - 1]);
  return out.join(" ");
}
const toPath = (points) =>
  points.map((p, i) => (i ? "L" : "M") + fmt(p.x) + " " + fmt(p.y)).join(" ");
function landscape(city, w, h) {
  const c = CITIES[city],
    parts = [],
    u = w / 100,
    v = h / 100,
    mini = w < 480;
  let seed = 1581 + city * 914;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const colors = [
    "#dedaca",
    "#e1dbcb",
    "#e9e0ce",
    "#e6dfd0",
    "#dcd8c8",
    "#e3dfcd",
  ];
  const ink = "#a49f89";
  parts.push('<rect width="100%" height="100%" fill="#f0ead9"/>');
  // Rounded city blocks form two differently oriented street grids on the banks.
  parts.push('<g transform="scale(' + u + " " + v + ')">');
  for (let district = 0; district < 3; district++) {
    const centerX = [12, 52, 90][district],
      angle = [-13, 9, -9][(district + city) % 3];
    parts.push('<g transform="rotate(' + angle + " " + centerX + ' 50)">');
    for (let x = centerX - 19; x < centerX + 18; x += 6.8) {
      for (let y = -13; y < 112; y += 5.2) {
        const j = rand() * 1.1,
          fill = colors[Math.floor(rand() * colors.length)];
        parts.push(
          '<rect x="' +
            fmt(x + j) +
            '" y="' +
            fmt(y + 0.3) +
            '" width="' +
            fmt(5.1 - j / 2) +
            '" height="' +
            fmt(3 + rand() * 0.9) +
            '" rx=".52" fill="' +
            fill +
            '"/>',
        );
      }
    }
    parts.push("</g>");
  }
  const roadY = 24 + city * 8;
  for (const r of [
    "M-12 88 Q22 46 43 47 T112 5",
    "M-8 " + roadY + " Q19 " + (roadY + 15) + " 46 37 T112 65",
    "M20 -12 Q47 24 37 63 T29 112",
    "M73 -8 Q64 20 76 46 T85 111",
  ]) {
    parts.push(
      '<path d="' +
        r +
        '" fill="none" stroke="#d7cfbc" stroke-width="1.65"/><path d="' +
        r +
        '" fill="none" stroke="#f8f1df" stroke-width="1.1"/>',
    );
  }
  for (const [x, y, pw, ph] of c.parks) {
    const path =
      "M " +
      (x - pw / 2) +
      " " +
      (y - ph / 2) +
      " q " +
      pw * 0.32 +
      " -2 " +
      pw * 0.62 +
      " -.6 l " +
      pw * 0.36 +
      " " +
      ph * 0.27 +
      " -.8 " +
      ph * 0.65 +
      " q -3 2 -" +
      pw * 0.8 +
      " 1 z";
    parts.push(
      '<path d="' +
        path +
        '" fill="' +
        c.tone +
        '" stroke="#b6c6a9" stroke-width=".22"/>',
    );
    for (let i = 0; i < 7; i++) {
      const tx = x + (rand() - 0.5) * (pw - 3),
        ty = y + (rand() - 0.5) * (ph - 3);
      parts.push(
        '<path d="m' +
          fmt(tx) +
          " " +
          fmt(ty) +
          ' -.65 1.2h1.3z" fill="#96ac8e" opacity=".7"/>',
      );
    }
  }
  for (const [cx, cy] of c.hills)
    for (let i = 0; i < 3; i++) {
      parts.push(
        '<path d="M ' +
          (cx - 9 - i) +
          " " +
          (cy + 3 + i) +
          " q 5 -" +
          (8 + i) +
          " 11 -5 t " +
          (12 + i) +
          ' 0" fill="none" stroke="#cbc4ad" stroke-width=".22"/>',
      );
    }
  const river = smooth(c.water);
  parts.push(
    '<path d="' +
      river +
      '" fill="none" stroke="#9eb6af" stroke-width="8.45"/><path d="' +
      river +
      '" fill="none" stroke="#a9cdd4" stroke-width="7.65"/>',
  );
  parts.push("</g>");
  // Water glints use small fixed strokes, independent of device aspect ratio.
  for (let i = 1; i < c.water.length - 2; i++) {
    const [ax, ay] = c.water[i],
      [bx, by] = c.water[i + 1];
    for (let j = 0; j < 3; j++) {
      const t = 0.3 + j * 0.15,
        x = (ax + (bx - ax) * t) * u,
        y = (ay + (by - ay) * t + (j % 2 ? 0.7 : -0.7)) * v;
      parts.push(
        '<path d="M' +
          fmt(x) +
          " " +
          fmt(y) +
          'q 2 1.5 5 0t 5 0" stroke="#e5f0e9" fill="none" opacity=".85"/>',
      );
    }
  }
  // Two footbridges and small engraved landmarks give each printed map its own character.
  const wi = [2, 4];
  for (const k of wi) {
    if (!c.water[k + 1]) continue;
    const a = c.water[k],
      b = c.water[k + 1],
      x = ((a[0] + b[0]) / 2) * u,
      y = ((a[1] + b[1]) / 2) * v;
    const ang =
      (Math.atan2((b[1] - a[1]) * v, (b[0] - a[0]) * u) * 180) / Math.PI + 90;
    const half = Math.min(32, 4 * Math.max(u, v));
    parts.push(
      '<g transform="translate(' +
        fmt(x) +
        " " +
        fmt(y) +
        ") rotate(" +
        fmt(ang) +
        ')" stroke="' +
        ink +
        '"><rect x="-' +
        half +
        '" y="-2" width="' +
        half * 2 +
        '" height="4" fill="#e7e0ca" stroke-width=".65"/><path d="M-' +
        half +
        " -3h" +
        half * 2 +
        "m-" +
        half * 2 +
        " 6h" +
        half * 2 +
        '" fill="none" stroke-width=".8"/></g>',
    );
  }
  const ornaments = [
    '<path d="m-16 3 16-8 17 8-17 8z" fill="#c6c6a9"/><path d="m-11 0 0-12 11-5 10 5V0L0 6z" fill="#dedac1"/><path d="m-12-12 12-7 12 7-12 6z" fill="#adae91"/><path d="M0-6V6m-7-12v5m14-6v5" fill="none"/>',
    '<path d="m-20 5 15-6 24 5-14 9z" fill="#b8c4b1"/><path d="M-14 2v-7l6-6 11 3 6 6v8z" fill="#dedfbd"/><path d="m-14-5 12 4 5-7m-5 7v8m-8-13 12 4m-5-7 8 4" fill="none"/>',
    '<path d="m-17 6 19-7 15 6-18 8z" fill="#c5c4aa"/><path d="M-3 1v-15l4-5 4 5V1L1 4z" fill="#dedac1"/><path d="m-5-14 6-8 6 8-6 3z" fill="#afae95"/><path d="M1-11V4m-11-1v-6l7-3" fill="none"/>',
  ];
  const places = [
    [9, 70],
    [76, 15],
    [88, 80],
  ];
  places.forEach(([x, y], i) => {
    parts.push(
      '<g transform="translate(' +
        fmt(x * u) +
        " " +
        fmt(y * v) +
        ") scale(" +
        (mini ? 0.66 : 1.04) +
        ')" opacity=".88" stroke="#92977c" stroke-width="1.1" stroke-linejoin="round">' +
        ornaments[(i + city) % 3] +
        "</g>",
    );
  });
  for (const [name, x, y] of c.districts)
    parts.push(
      '<text x="' +
        fmt(x * u) +
        '" y="' +
        fmt(y * v) +
        '" text-anchor="middle" fill="#858477" font-family="system-ui,sans-serif" font-size="' +
        (mini ? 8 : 10) +
        '" font-weight="650" letter-spacing="' +
        (mini ? 1.1 : 2) +
        '">' +
        name +
        "</text>",
    );
  const a = c.water[3],
    b = c.water[4],
    rx = ((a[0] + b[0]) / 2) * u,
    ry = ((a[1] + b[1]) / 2) * v;
  const angle =
    (Math.atan2((b[1] - a[1]) * v, (b[0] - a[0]) * u) * 180) / Math.PI;
  parts.push(
    '<text transform="translate(' +
      fmt(rx) +
      " " +
      fmt(ry) +
      ") rotate(" +
      fmt(angle) +
      ')" text-anchor="middle" fill="#436c79" font-family="Georgia,serif" font-style="italic" font-size="' +
      (mini ? 10 : 13) +
      '">' +
      c.riverName +
      "</text>",
  );
  return parts.join("");
}
function routeEdges(routes) {
  const shares = new Map();
  routes.forEach((r, line) => {
    for (let j = 1; j < r.length; j++) {
      const a = r[j - 1],
        b = r[j],
        key = Math.min(a, b) * 8 + Math.max(a, b);
      if (!shares.has(key)) shares.set(key, []);
      shares.get(key).push(line);
    }
  });
  return shares;
}
export function trackPoints(city, start, end, w, h, line, shares) {
  const low = Math.min(start, end),
    high = Math.max(start, end),
    stations = CITIES[city].stations;
  const a = stations[low],
    b = stations[high],
    elbow = bend(a, b);
  const pt = (p) => ({ x: (p.x * w) / 100, y: (p.y * h) / 100 }),
    first = pt(a),
    last = pt(b),
    middle = pt(elbow);
  const ids = shares.get(low * 8 + high) || [],
    slot = ids.indexOf(line);
  const offset = slot < 0 ? 0 : (slot - (ids.length - 1) / 2) * 6.2;
  const dx = last.x - first.x,
    dy = last.y - first.y,
    length = Math.hypot(dx, dy) || 1;
  const ox = (-dy / length) * offset,
    oy = (dx / length) * offset;
  let points = [
    first,
    {
      x: first.x + (middle.x - first.x) * 0.28 + ox,
      y: first.y + (middle.y - first.y) * 0.28 + oy,
    },
    { x: middle.x + ox, y: middle.y + oy },
    {
      x: last.x + (middle.x - last.x) * 0.22 + ox,
      y: last.y + (middle.y - last.y) * 0.22 + oy,
    },
    last,
  ];
  points = points.filter(
    (p, i) =>
      !i || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 0.02,
  );
  return start === low ? points : points.reverse();
}
export function along(points, fraction) {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let left =
    Math.max(0, Math.min(1, fraction)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i];
    if (left <= len || i === lengths.length - 1) {
      const t = left / (len || 1),
        a = points[i],
        b = points[i + 1];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    left -= len;
  }
  return { ...points[0], angle: 0 };
}
export function createMap({ onStop, onSweep }) {
  const board = document.getElementById("map"),
    paper = document.getElementById("paper"),
    tracks = document.getElementById("tracks"),
    vehicles = document.getElementById("vehicles"),
    layer = document.getElementById("stops");
  const trains = LINES.map((l) => {
    const g = svgEl("g");
    g.innerHTML =
      '<rect x="-11" y="-5.3" width="22" height="10.6" rx="4.2" fill="' +
      l.color +
      '" stroke="#fffdf4" stroke-width="1.5"/><rect x="-7.4" y="-3" width="8" height="6" rx="1.6" fill="#203e44"/><rect x="2.4" y="-3" width="4.7" height="6" rx="1.5" fill="#e7f2eb"/><path d="M8.7-1.9v3.8" stroke="#ffdb7d" stroke-width="1.5"/>';
    vehicles.appendChild(g);
    return g;
  });
  const nodes = [];
  let terrainKey = "",
    trackKey = "",
    w = 1,
    h = 1,
    shares = new Map(),
    city = 0,
    lastArgs = null,
    gesture = null,
    skipClick = 0;
  function ensureNodes(s) {
    const list = CITIES[s.city].stations;
    while (nodes.length > s.open) nodes.pop().remove();
    while (nodes.length < s.open) {
      const id = nodes.length,
        b = document.createElement("button");
      b.type = "button";
      b.className = "station";
      b.dataset.stop = String(id);
      b.innerHTML =
        '<span class="station-symbol"><svg viewBox="0 0 20 20" aria-hidden="true"></svg></span><span class="queue" aria-hidden="true"></span><span class="station-label" aria-hidden="true"></span>';
      b.addEventListener("click", (e) => {
        if (e.detail && performance.now() < skipClick) return;
        onStop(id);
      });
      nodes.push(b);
      layer.appendChild(b);
    }
    nodes.forEach((b, id) => {
      const loc = list[id];
      if (b.dataset.city !== String(s.city)) {
        delete b.dataset.state;
        b.dataset.city = String(s.city);
        b.style.left = loc.x + "%";
        b.style.top = loc.y + "%";
        b.querySelector("svg").innerHTML = glyphs[loc.icon];
        b.querySelector(".station-label").textContent = loc.name;
      }
    });
  }
  function render(s, selected, line, draft, alpha = 0, reduced = false) {
    lastArgs = [s, selected, line, draft, alpha, reduced];
    city = s.city;
    w = Math.max(1, board.clientWidth);
    h = Math.max(1, board.clientHeight);
    const terrain = [city, w, h].join("-");
    if (terrain !== terrainKey) {
      terrainKey = terrain;
      trackKey = "";
      for (const el of [paper, tracks, vehicles])
        el.setAttribute("viewBox", "0 0 " + w + " " + h);
      paper.innerHTML = landscape(city, w, h);
    }
    ensureNodes(s);
    const routes = s.routes.map((r, i) => (draft && i === line ? draft : r));
    const key = [terrain, JSON.stringify(routes), draft !== null, line].join(
      "|",
    );
    if (key !== trackKey) {
      trackKey = key;
      shares = routeEdges(routes);
      const out = [];
      routes.forEach((r, i) => {
        const pts = [];
        for (let j = 1; j < r.length; j++) {
          const edge = trackPoints(city, r[j - 1], r[j], w, h, i, shares);
          pts.push(...(j === 1 ? edge : edge.slice(1)));
        }
        if (!pts.length) return;
        const d = toPath(pts),
          width = w < 450 ? 4.6 : 6;
        out.push(
          '<path d="' +
            d +
            '" fill="none" stroke="#fffbec" stroke-width="' +
            (width + 3.6) +
            '" stroke-linejoin="round" stroke-linecap="round"/><path d="' +
            d +
            '" fill="none" stroke="' +
            LINES[i].color +
            '" stroke-width="' +
            width +
            '" stroke-linejoin="round" stroke-linecap="round"' +
            (draft !== null && i === line ? ' stroke-dasharray="8 5"' : "") +
            "/>",
        );
      });
      tracks.innerHTML = out.join("");
    }
    for (let id = 0; id < s.open; id++) {
      const b = nodes[id],
        q = s.queues[id].length,
        members = routes.filter((r) => r.includes(id)).length,
        place = draft ? draft.indexOf(id) : -1;
      const state = [
        q,
        members,
        id === selected,
        place,
        line,
        s.order?.target === id && !s.order?.won,
      ].join(":");
      if (b.dataset.state === state) continue;
      b.dataset.state = state;
      b.classList.toggle("isolated", !members);
      b.classList.toggle("interchange", members > 1);
      b.classList.toggle("chosen", id === selected);
      b.classList.toggle("busy", q >= 6);
      b.classList.toggle(
        "order-target",
        s.order?.target === id && !s.order?.won,
      );
      b.classList.toggle("in-draft", place >= 0);
      b.style.setProperty("--line", LINES[line].color);
      const badge = b.querySelector(".queue");
      badge.textContent = q;
      badge.hidden = !q;
      b.setAttribute(
        "aria-label",
        CITIES[city].stations[id].name +
          ", " +
          q +
          " waiting" +
          (members > 1 ? ", interchange" : !members ? ", unconnected" : "") +
          (place >= 0 ? ", draft stop " + (place + 1) : ""),
      );
    }
    move(s, alpha, reduced);
  }
  function move(s, alpha = 0, reduced = false) {
    const speed = s.clock < s.boostUntil ? 21.6 : 14;
    s.trains.forEach((t, i) => {
      const g = trains[i];
      g.style.display = t ? "" : "none";
      if (!t) return;
      const st = CITIES[s.city].stations[t.at];
      let pose;
      if (t.to === null) {
        // Park at the station edge so its route symbol remains legible.
        const r = s.routes[i],
          ix = r.indexOf(t.at),
          target = r[ix + t.dir] ?? r[ix - t.dir];
        if (target !== undefined && target !== t.at) {
          const pts = trackPoints(s.city, t.at, target, w, h, i, shares);
          const length = Math.hypot(
            pts[pts.length - 1].x - pts[0].x,
            pts[pts.length - 1].y - pts[0].y,
          );
          pose = along(pts, Math.min(0.22, 19 / (length || 1)));
        } else
          pose = { x: (st.x * w) / 100 + 12, y: (st.y * h) / 100, angle: 0 };
      } else {
        const pts = trackPoints(s.city, t.at, t.to, w, h, i, shares);
        const target = CITIES[s.city].stations[t.to],
          len = Math.hypot(st.x - target.x, (st.y - target.y) * 0.78);
        const f =
          t.pct +
          (s.phase === "running" && !reduced
            ? (alpha * speed) / 5 / Math.max(1, len)
            : 0);
        pose = along(pts, Math.min(1, f));
      }
      g.setAttribute(
        "transform",
        "translate(" +
          fmt(pose.x) +
          " " +
          fmt(pose.y) +
          ") rotate(" +
          fmt(pose.angle) +
          ")",
      );
    });
  }
  function nearest(e) {
    const rect = board.getBoundingClientRect();
    let best = -1,
      d = 25;
    for (let id = 0; id < nodes.length; id++) {
      const p = CITIES[city].stations[id],
        dist = Math.hypot(
          e.clientX - rect.left - (p.x * w) / 100,
          e.clientY - rect.top - (p.y * h) / 100,
        );
      if (dist < d) {
        best = id;
        d = dist;
      }
    }
    return best;
  }
  board.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !lastArgs || lastArgs[3] === null || gesture) return;
    const first = nearest(e);
    if (first >= 0)
      gesture = {
        id: e.pointerId,
        first,
        x: e.clientX,
        y: e.clientY,
        drag: false,
        visited: new Set(),
      };
  });
  board.addEventListener("pointermove", (e) => {
    if (!gesture || gesture.id !== e.pointerId) return;
    if (
      !gesture.drag &&
      Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) < 7
    )
      return;
    if (!gesture.drag) {
      gesture.drag = true;
      try {
        board.setPointerCapture(e.pointerId);
      } catch {}
    }
    for (const id of [gesture.first, nearest(e)])
      if (id >= 0 && !gesture.visited.has(id)) {
        gesture.visited.add(id);
        onSweep(id);
      }
  });
  function release() {
    if (gesture?.drag) skipClick = performance.now() + 550;
    gesture = null;
  }
  board.addEventListener("pointerup", release);
  board.addEventListener("pointercancel", release);
  board.addEventListener("pointerleave", () => {
    if (!gesture?.drag) gesture = null;
  });
  function resize() {
    if (lastArgs) render(...lastArgs);
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(board);
  window.addEventListener("resize", resize);
  return { render, move, resize };
}
