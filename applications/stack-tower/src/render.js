/* Original isometric canvas artwork. Noorullah Adel, 2026. MIT. */
export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let width = 0,
    height = 0,
    scale = 1,
    camera = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    width = r.width;
    height = r.height;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width / 500, height / 430, 1.35);
  }
  function point(x, z, y) {
    return [
      width / 2 + (x - z) * 0.866 * scale,
      height * 0.69 + (x + z) * 0.5 * scale - (y - camera) * scale,
    ];
  }
  function polygon(points, fill, stroke) {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  function block(b, hue, alpha = 1) {
    ctx.globalAlpha = alpha;
    const x = b.x - b.w / 2,
      z = b.z - b.d / 2,
      y = b.y,
      p = [
        point(x, z, y + b.h),
        point(x + b.w, z, y + b.h),
        point(x + b.w, z + b.d, y + b.h),
        point(x, z + b.d, y + b.h),
      ],
      a = point(x + b.w, z, y),
      c = point(x + b.w, z + b.d, y),
      d = point(x, z + b.d, y);
    polygon([p[1], a, c, p[2]], `hsl(${hue} 63% 39%)`);
    polygon([p[2], c, d, p[3]], `hsl(${hue} 66% 49%)`);
    polygon(p, `hsl(${hue} 80% 68%)`, `hsl(${hue} 80% 80% / .45)`);
    ctx.globalAlpha = 1;
  }
  function draw(g, effects, dt) {
    if (!width || !height) return;
    const target = Math.max(0, (g.blocks.at(-1)?.y || 0) - 105);
    camera = effects
      ? camera + (target - camera) * (1 - Math.exp(-Math.max(dt, 0.016) * 6))
      : target;
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#101522");
    gradient.addColorStop(1, "#1e2938");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#a6c3db0d";
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(...point(i * 80, -500, -32));
      ctx.lineTo(...point(i * 80, 500, -32));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(...point(-500, i * 80, -32));
      ctx.lineTo(...point(500, i * 80, -32));
      ctx.stroke();
    }
    const base = g.blocks.at(-1);
    if (g.moving) {
      const shadow = { ...g.moving, y: base.y + 1, h: 0 };
      ctx.globalAlpha = 0.15;
      const p = [
        point(shadow.x - shadow.w / 2, shadow.z - shadow.d / 2, shadow.y + 24),
        point(shadow.x + shadow.w / 2, shadow.z - shadow.d / 2, shadow.y + 24),
        point(shadow.x + shadow.w / 2, shadow.z + shadow.d / 2, shadow.y + 24),
        point(shadow.x - shadow.w / 2, shadow.z + shadow.d / 2, shadow.y + 24),
      ];
      polygon(p, "#fff");
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < g.blocks.length; i++)
      block(
        g.blocks[i],
        (195 + (g.height - g.blocks.length + 1 + i) * 9) % 360,
        0.38 + (0.62 * (i + 1)) / g.blocks.length,
      );
    if (effects)
      for (const p of g.falling)
        block(p, (195 + g.height * 9) % 360, Math.max(0, 1 - p.age));
    if (g.moving) block(g.moving, (195 + (g.height + 1) * 9) % 360);
    ctx.fillStyle = "#adbfce88";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("NOORULLAH ADEL · 2026", width / 2, height - 14);
  }
  resize();
  return { resize, draw };
}
