/* Original Canvas artwork. Copyright (c) 2026 Noorullah Adel. MIT. */
import { WORLD_HEIGHT } from "./engine.js";
function rounded(c, x, y, w, h, r = 5) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
  c.fill();
}
function line(c, points, color, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}
function oval(c, x, y, rx, ry, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
function cloud(c, x, y, s, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = "#fff6df";
  c.beginPath();
  c.moveTo(-45, 8);
  c.bezierCurveTo(-62, -3, -29, -22, -17, -13);
  c.bezierCurveTo(-20, -44, 30, -44, 34, -13);
  c.bezierCurveTo(51, -20, 72, 1, 53, 9);
  c.closePath();
  c.fill();
  c.restore();
}
export function drawFish(c, x, y, gold = false, size = 1) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  c.lineWidth = 1.2;
  c.strokeStyle = gold ? "#a17c28" : "#ad724a";
  c.fillStyle = gold ? "#f4cf66" : "#f0ad77";
  c.beginPath();
  c.moveTo(-5, 0);
  c.bezierCurveTo(0, -10, 11, -8, 16, 0);
  c.bezierCurveTo(10, 8, 0, 9, -5, 0);
  c.lineTo(-14, 7);
  c.lineTo(-14, -7);
  c.closePath();
  c.fill();
  c.stroke();
  oval(c, 10, -1, 1.15, 1.15, "#685439");
  line(
    c,
    [
      [2, -2],
      [2, 3],
    ],
    gold ? "#b99b4b" : "#ce8a60",
  );
  if (gold) {
    line(
      c,
      [
        [-3, -14],
        [3, -14],
      ],
      "#fff1a4",
    );
    line(
      c,
      [
        [0, -17],
        [0, -11],
      ],
      "#fff1a4",
    );
  }
  c.restore();
}
export function drawCat(
  c,
  p,
  time = 0,
  coat = "ginger",
  invulnerable = false,
  reduced = false,
) {
  c.save();
  c.translate(p.x + p.w / 2, p.y + p.h);
  if (invulnerable && Math.floor(time * 11) % 2) c.globalAlpha = 0.42;
  if (!p.grounded) c.rotate(p.vy < 0 ? -0.09 : 0.08);
  const fur = { ginger: "#d59158", midnight: "#515e62", cloud: "#f0e3ca" }[
      coat
    ],
    shade = { ginger: "#ac6c40", midnight: "#39464c", cloud: "#d3bda2" }[coat],
    edge = "#584f41",
    step = p.grounded && !reduced ? Math.sin(time * 26) * 4 : 0;
  c.strokeStyle = shade;
  c.lineWidth = 8;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-12, -17);
  c.bezierCurveTo(
    -32,
    -17,
    -34,
    -36,
    -27,
    -41 + (reduced ? 0 : Math.sin(time * 5) * 3),
  );
  c.stroke();
  c.fillStyle = shade;
  rounded(c, -16 + step, -13, 10, 14, 4);
  rounded(c, 5 - step, -12, 10, 13, 4);
  c.fillStyle = fur;
  rounded(c, -21, -31, 38, 26, 11);
  rounded(c, -18 - step, -10, 11, 12, 4);
  rounded(c, 10 + step, -10, 10, 12, 4);
  c.fillStyle = shade;
  rounded(c, -11, -30, 5, 9, 2);
  rounded(c, -2, -30, 4, 8, 2);
  c.fillStyle = fur;
  c.beginPath();
  c.moveTo(-1, -33);
  c.lineTo(-1, -49);
  c.lineTo(11, -42);
  c.lineTo(21, -48);
  c.lineTo(27, -32);
  c.closePath();
  c.fill();
  oval(c, 12, -32, 15, 13, fur);
  c.fillStyle = "#dba28d";
  c.beginPath();
  c.moveTo(2, -44);
  c.lineTo(3, -37);
  c.lineTo(9, -39);
  c.fill();
  c.beginPath();
  c.moveTo(20, -44);
  c.lineTo(17, -38);
  c.lineTo(23, -36);
  c.fill();
  oval(c, 18, -28, 8, 7, coat === "midnight" ? "#a5a9a0" : "#f6dcbc");
  oval(c, 10, -33, 1.6, 2.2, edge);
  oval(c, 22, -33, 1.6, 2.2, edge);
  c.fillStyle = "#9f665a";
  c.beginPath();
  c.moveTo(18, -29);
  c.lineTo(23, -29);
  c.lineTo(21, -26);
  c.fill();
  line(
    c,
    [
      [20, -25],
      [19, -23],
      [17, -23],
    ],
    edge,
    0.8,
  );
  line(
    c,
    [
      [23, -26],
      [31, -29],
    ],
    edge,
    0.65,
  );
  line(
    c,
    [
      [24, -23],
      [32, -22],
    ],
    edge,
    0.65,
  );
  c.fillStyle = "#668673";
  c.beginPath();
  c.moveTo(-1, -22);
  c.lineTo(10, -20);
  c.lineTo(12, -15);
  c.lineTo(-4, -18);
  c.closePath();
  c.fill();
  c.fillStyle = "#577c68";
  c.beginPath();
  c.moveTo(-1, -19);
  c.lineTo(-13, -11 + step * 0.3);
  c.lineTo(-13, -20);
  c.closePath();
  c.fill();
  c.restore();
}
export function createRenderer(canvas) {
  const c = canvas.getContext("2d", { alpha: false });
  if (!c) throw Error("Canvas unavailable");
  let width = 960,
    scale = 1;
  function resize() {
    const b = canvas.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) return;
    const d = Math.min(2, globalThis.devicePixelRatio || 1);
    width = (b.width / b.height) * WORLD_HEIGHT;
    canvas.width = Math.round(b.width * d);
    canvas.height = Math.round(b.height * d);
    scale = canvas.width / width;
  }
  function draw(g, prefs, particles = []) {
    const night = prefs.sky === "moonlight",
      reduced = prefs.reduced,
      camera = Math.max(0, g.player.x - width * 0.26);
    c.setTransform(scale, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
    const sky = c.createLinearGradient(0, 0, 0, 520);
    sky.addColorStop(0, night ? "#2d4253" : "#f3d7b8");
    sky.addColorStop(0.68, night ? "#777981" : "#edd4b0");
    sky.addColorStop(1, night ? "#a68d87" : "#e8d4ad");
    c.fillStyle = sky;
    c.fillRect(0, 0, width, 520);
    const sunX = width * 0.76 - ((camera * 0.025) % (width * 0.1));
    oval(c, sunX, 136, 58, 58, night ? "#eee4c1" : "#f5e3b4");
    if (night) {
      oval(c, sunX + 21, 122, 52, 52, "#3a4d5b");
      for (let i = 0; i < 37; i++) {
        const x = (i * 83 + 24) % Math.ceil(width),
          y = 25 + ((i * 41) % 175);
        oval(c, x, y, 0.7 + (i % 3) * 0.25, 0.7 + (i % 3) * 0.25, "#ede9cd9c");
      }
    }
    cloud(
      c,
      width * 0.19 - ((camera * 0.035) % 100),
      104,
      0.88,
      night ? 0.13 : 0.32,
    );
    cloud(
      c,
      width * 0.57 - ((camera * 0.02) % 100),
      61,
      0.55,
      night ? 0.12 : 0.23,
    );
    for (let layer = 0; layer < 3; layer++) {
      const unit = [102, 125, 150][layer],
        offset = camera * [0.09, 0.18, 0.34][layer],
        start = Math.floor(offset / unit) - 1;
      for (let i = start; i < start + Math.ceil(width / unit) + 3; i++) {
        const seed = (i * 73856093 + layer * 19349663) >>> 0,
          h = 64 + (seed % 114),
          x = i * unit - offset,
          y = [345, 382, 438][layer] - h;
        c.fillStyle = night
          ? ["#69717b", "#77787d", "#7f7c7b"][layer]
          : ["#c5c9b1", "#b6bba2", "#a3ad97"][layer];
        c.fillRect(x, y, unit - 6, h + 230);
        if (seed % 3 === 0) {
          c.fillRect(x + 18, y - 13, unit - 44, 15);
          line(
            c,
            [
              [x + unit * 0.6, y],
              [x + unit * 0.6, y - 26],
            ],
            night ? "#6c6e72" : "#b4baa2",
            2,
          );
        }
        if (seed % 4 === 1) {
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x + (unit - 6) / 2, y - 30);
          c.lineTo(x + unit - 6, y);
          c.fill();
        }
        c.fillStyle = night ? "#efd99a52" : "#ecdfbb66";
        for (let col = 0; col < 3; col++)
          for (let row = 0; row < 3 + layer; row++)
            if ((seed + row + col) % 3 !== 0)
              c.fillRect(x + 17 + col * (unit / 4), y + 22 + row * 26, 10, 14);
      }
    }
    for (let i = 0; i < 3; i++) {
      const x = width * 0.3 + i * 28 - ((camera * 0.04) % width);
      c.strokeStyle = night ? "#d8ceba88" : "#8d9b7b66";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x - 5, 154 + i * 6);
      c.quadraticCurveTo(x, 149 + i * 6, x + 5, 154 + i * 6);
      c.quadraticCurveTo(x + 10, 149 + i * 6, x + 15, 154 + i * 6);
      c.stroke();
    }
    c.save();
    c.translate(-camera, 0);
    for (const r of g.roofs) {
      if (r.x + r.w < camera - 60 || r.x > camera + width + 60) continue;
      c.fillStyle = (
        night
          ? ["#7d7373", "#7e737c", "#6b7776", "#877b78"]
          : ["#b3947a", "#ad9a7b", "#9d9f87", "#b69b81"]
      )[r.style];
      c.fillRect(r.x, r.y, r.w, 520 - r.y);
      c.fillStyle = night ? "#c5a08b" : "#d7b397";
      c.fillRect(r.x - 4, r.y - 8, r.w + 8, 9);
      c.fillStyle = night ? "#665f65" : "#8c8772";
      c.fillRect(r.x, r.y + 2, r.w, 5);
      const brick = night ? "#b4a39a33" : "#ddc3a044";
      for (let row = 0; row < 5; row++) {
        const y = r.y + 20 + row * 26;
        line(
          c,
          [
            [r.x, y],
            [r.x + r.w, y],
          ],
          brick,
        );
        for (let x = r.x + (row % 2 ? 0 : 23); x < r.x + r.w; x += 48)
          line(
            c,
            [
              [x, y],
              [x, y + 25],
            ],
            brick,
          );
      }
      for (let x = r.x + 45; x < r.x + r.w - 30; x += 81) {
        c.fillStyle = night ? "#d4b776" : "#7f8571";
        rounded(c, x, r.y + 53, 29, 47, 13);
        c.fillStyle = night ? "#b08e60" : "#cdc0a0";
        c.fillRect(x + 13, r.y + 54, 3, 46);
        c.fillRect(x, r.y + 76, 29, 3);
        c.fillStyle = night ? "#9c877a" : "#d4bca0";
        c.fillRect(x - 4, r.y + 101, 37, 4);
      }
      if (r.id % 3 === 0) {
        const x = r.x + r.w - 43;
        c.fillStyle = night ? "#ab8e7c" : "#d2a080";
        c.beginPath();
        c.moveTo(x - 10, r.y - 8);
        c.lineTo(x - 7, r.y - 27);
        c.lineTo(x + 8, r.y - 27);
        c.lineTo(x + 10, r.y - 8);
        c.fill();
        line(
          c,
          [
            [x, r.y - 27],
            [x, r.y - 57],
          ],
          "#6e8663",
          3,
        );
        oval(c, x - 6, r.y - 44, 9, 4, "#81996e");
        oval(c, x + 6, r.y - 51, 9, 4, "#8fa77c");
      }
    }
    for (const h of g.hazards) {
      if (h.x < camera - 50 || h.x > camera + width + 30) continue;
      c.fillStyle = night ? "#755e61" : "#9f6c58";
      c.fillRect(h.x, h.y, h.w, h.h);
      c.fillStyle = night ? "#c39e8a" : "#d1a286";
      rounded(c, h.x - 4, h.y - 5, h.w + 8, 9, 2);
      c.fillStyle = night ? "#5b525b" : "#835b4a";
      c.fillRect(h.x + 4, h.y - 4, h.w - 8, 3);
      for (let i = 1; i < 4; i++)
        line(
          c,
          [
            [h.x, h.y + i * 10],
            [h.x + h.w, h.y + i * 10],
          ],
          night ? "#ad878066" : "#ca967455",
        );
    }
    for (const f of g.fish)
      if (!f.taken && f.x > camera - 35 && f.x < camera + width + 35)
        drawFish(
          c,
          f.x,
          f.y + (reduced ? 0 : Math.sin(g.time * 3 + f.x) * 2),
          f.gold,
          0.9,
        );
    if (g.player.grounded)
      oval(
        c,
        g.player.x + 16,
        g.player.y + g.player.h + 1,
        21,
        3,
        night ? "#312e3330" : "#62544225",
      );
    drawCat(c, g.player, g.time, prefs.cat, g.invulnerable > 0, reduced);
    for (const p of particles) {
      if (p.type === "fish") {
        const progress = Math.min(1, p.age / 0.75);
        c.globalAlpha = 1 - progress;
        c.fillStyle = night ? "#fff4be" : "#fff9df";
        c.strokeStyle = "#9b7f53";
        c.lineWidth = 2;
        c.font = "700 17px system-ui, sans-serif";
        c.textAlign = "center";
        c.strokeText(`+${p.points}`, p.x, p.y - 18 - progress * 32);
        c.fillText(`+${p.points}`, p.x, p.y - 18 - progress * 32);
        c.globalAlpha = 1;
      } else {
        c.globalAlpha = Math.max(0, 1 - p.age / 0.35);
        oval(c, p.x, p.y - p.age * 25, 3 + p.age * 8, 2, "#efe2c2");
        c.globalAlpha = 1;
      }
    }
    c.restore();
  }
  resize();
  return {
    resize,
    draw,
    get width() {
      return width;
    },
  };
}
