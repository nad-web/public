/* Original canvas artwork. Copyright (c) 2026 Noorullah Adel. MIT. */
import { PLAYER_X } from "./engine.js";
import { DINO, DUCK, BIRD, SKINS } from "./sprites.js";
const blend = (a, b, t) => {
  const v = [1, 3, 5].map((i) =>
    Math.round(
      parseInt(a.slice(i, i + 2), 16) * (1 - t) +
        parseInt(b.slice(i, i + 2), 16) * t,
    ),
  );
  return `rgb(${v.join(",")})`;
};
export const nightMode = (g, prefs, reduced = false) =>
  prefs.theme === "night" ||
  (prefs.theme === "auto" &&
    prefs.effects &&
    !reduced &&
    Math.floor(g.distance / 3000) % 2 === 1);
export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  let width = 900,
    height = 330,
    dpr = 1,
    night = 0,
    last = 0;
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.imageSmoothingEnabled = false;
  }
  function pixels(map, x, y, size, color, eye, legs = false, frame = 0) {
    ctx.fillStyle = color;
    for (let row = 0; row < map.length; row++)
      for (let col = 0; col < map[row].length; col++) {
        const dot = map[row][col];
        if (dot === " ") continue;
        if (legs && row >= 19) continue;
        ctx.fillStyle = dot === "." ? eye : color;
        ctx.fillRect(
          Math.round(x + col * size),
          Math.round(y + row * size),
          Math.ceil(size),
          Math.ceil(size),
        );
      }
    if (legs) {
      ctx.fillStyle = color;
      const lift = frame % 2 ? 3 : 0;
      ctx.fillRect(x + 16, y + 50, 6, 9 - lift);
      ctx.fillRect(x + 16, y + 57 - lift, 10, 3);
      ctx.fillRect(x + 28, y + 50, 6, 6 + lift);
      ctx.fillRect(x + 28, y + 54 + lift, 10, 3);
    }
  }
  function draw(g, prefs, reduce = false, now = 0) {
    const dt = Math.min(0.08, Math.max(0, (now - last) / 1000));
    last = now;
    const target = nightMode(g, prefs, reduce) ? 1 : 0;
    night = target;
    const paper = blend("#fbfaf2", "#202d31", night),
      ink = blend("#3f4d43", "#d4ddd2", night),
      faint = blend("#deded0", "#465357", night),
      sand = blend("#ece8d7", "#344246", night),
      amber = blend("#d7a24a", "#e9c783", night);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);
    const view = Math.max(560, Math.min(1100, width)),
      scale = width / view,
      ground = (height - 54) / scale,
      worldHeight = height / scale;
    ctx.save();
    ctx.scale(scale, scale);
    if (night > 0.05) {
      ctx.globalAlpha = night;
      ctx.fillStyle = "#ecddae";
      ctx.beginPath();
      ctx.arc(view - 75, 65, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = paper;
      ctx.beginPath();
      ctx.arc(view - 67, 59, 15, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 17; i++) {
        ctx.globalAlpha = night * (0.4 + (i % 3) * 0.2);
        ctx.fillStyle = "#c8d6cd";
        const x = (i * 127 + 37) % view,
          y = 22 + ((i * 47) % 110);
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (night < 0.98) {
      ctx.globalAlpha = 1 - night;
      ctx.fillStyle = amber;
      ctx.beginPath();
      ctx.arc(view - 95, 95, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = faint;
    const drift = prefs.effects && !reduce ? g.distance * 0.1 : 0;
    for (let i = 0; i < 5; i++) {
      const x =
          ((((i * 233 + 90 - drift) % (view + 250)) + (view + 250)) %
            (view + 250)) -
          100,
        y = 70 + ((i * 37) % 75);
      ctx.globalAlpha = 0.65;
      ctx.fillRect(x, y, 49, 3);
      ctx.fillRect(x + 9, y - 5, 27, 5);
      ctx.fillRect(x + 17, y - 9, 13, 4);
    }
    ctx.globalAlpha = 1;
    const mountainShift = prefs.effects && !reduce ? g.distance * 0.035 : 0;
    ctx.fillStyle = sand;
    for (let i = 0; i < 7; i++) {
      const x = i * 260 - (mountainShift % 260) - 180;
      ctx.beginPath();
      ctx.moveTo(x, ground);
      ctx.lineTo(x + 128, ground - 56 - (i % 3) * 18);
      ctx.lineTo(x + 270, ground);
      ctx.fill();
    }
    ctx.fillStyle = faint;
    ctx.fillRect(0, ground, view, 2);
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 35; i++) {
      const x =
          ((((i * 61 - g.distance) % (view + 90)) + (view + 90)) %
            (view + 90)) -
          30,
        y = ground + 8 + ((i * 19) % 25);
      ctx.fillRect(x, y, i % 3 === 0 ? 14 : 5, 1);
    }
    ctx.globalAlpha = 1;
    for (const o of g.obstacles) {
      const x = o.x - g.distance;
      if (x > view + 80 || x + o.width < -80) continue;
      const bottom = ground - o.bottom,
        y = bottom - o.height;
      ctx.fillStyle = ink;
      if (o.type.startsWith("flyer")) {
        pixels(BIRD, x, y, 2.3, ink, paper);
        if (Math.floor(g.elapsed * 9 + o.id) % 2) {
          ctx.fillStyle = paper;
          ctx.fillRect(x + 13, y, 17, 10);
          ctx.fillStyle = ink;
          ctx.fillRect(x + 18, y + 9, 5, 14);
          ctx.fillRect(x + 22, y + 15, 6, 8);
        }
      } else if (o.type === "rocks") {
        ctx.fillRect(x + 3, bottom - 11, 42, 11);
        ctx.fillRect(x + 8, bottom - 19, 17, 19);
        ctx.fillRect(x + 26, bottom - 25, 14, 25);
        ctx.fillStyle = paper;
        ctx.fillRect(x + 12, bottom - 15, 4, 2);
        ctx.fillRect(x + 31, bottom - 19, 4, 2);
      } else {
        const w = o.width,
          h = o.height,
          stem = Math.round(w * 0.35),
          center = x + Math.round(w * 0.4);
        ctx.fillRect(center, bottom - h, stem, h);
        ctx.fillRect(x + 2, bottom - h * 0.65, stem, h * 0.35);
        ctx.fillRect(x + 2, bottom - h * 0.37, w * 0.5, stem);
        ctx.fillRect(x + w - stem - 1, bottom - h * 0.84, stem, h * 0.41);
        ctx.fillRect(center, bottom - h * 0.46, w * 0.55, stem);
        ctx.fillStyle = paper;
        ctx.globalAlpha = 0.38;
        ctx.fillRect(center + 2, bottom - h + 6, 1, h - 12);
        ctx.globalAlpha = 1;
      }
      if (o.hit && g.invulnerable > 0 && prefs.effects && !reduce) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = paper;
        ctx.fillRect(x - 2, y - 2, o.width + 4, o.height + 4);
        ctx.globalAlpha = 1;
      }
    }
    const skin = SKINS[prefs.skin] || SKINS.fern,
      dinoColor = night > 0.5 ? blend(skin.body, "#d2dfc8", 0.64) : skin.body,
      frame = g.phase === "running" ? Math.floor(g.elapsed * 12) : 0,
      duck = g.player.duck && g.player.y === 0;
    ctx.save();
    if (
      g.invulnerable > 0 &&
      prefs.effects &&
      !reduce &&
      Math.floor(g.elapsed * 13) % 2
    )
      ctx.globalAlpha = 0.4;
    const y = ground - g.player.y - (duck ? 25 : 59.4);
    pixels(
      duck ? DUCK : DINO,
      PLAYER_X,
      y,
      duck ? 2.25 : 2.7,
      dinoColor,
      paper,
      !duck,
      frame,
    );
    ctx.fillStyle = skin.scarf;
    if (duck) {
      ctx.fillRect(PLAYER_X + 42, y + 11, 10, 3);
      ctx.fillRect(PLAYER_X + 39, y + 14, 5, 3);
    } else {
      ctx.fillRect(PLAYER_X + 31, y + 23, 11, 3);
      ctx.fillRect(PLAYER_X + 29, y + 26, 6, 5);
    }
    ctx.restore();
    if (prefs.effects && !reduce && g.phase === "running" && g.player.y === 0) {
      ctx.fillStyle = faint;
      for (let i = 0; i < 4; i++) {
        const age = (g.elapsed * 3 + i * 0.25) % 1;
        ctx.globalAlpha = (1 - age) * 0.55;
        ctx.fillRect(PLAYER_X - 8 - age * 28, ground - 3 - age * 8, 3, 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.fillStyle = blend("#8b8d80", "#889999", night);
    ctx.font = "8px monospace";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("NOORULLAH ADEL · 2026", 15, height - 16);
    ctx.textAlign = "right";
    ctx.fillText("A LITTLE FURTHER.", width - 15, height - 16);
    ctx.textAlign = "left";
  }
  resize();
  return { draw, resize };
}
