/* Original share-card layout. Noorullah Adel, 2026. MIT. */
import { CATEGORIES } from "./engine.js";
export const escapeXML = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export function challengeText(card) {
  return `${card.title}\n${CATEGORIES.find((c) => c.id === card.category).name} · ${card.minutes} minutes\n\n${card.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nBoredom Roulette · Designed & developed by Noorullah Adel · 2026`;
}
function wrap(text, limit) {
  const width = (t) =>
      [...t].reduce(
        (sum, c) =>
          sum +
          (/[ilI.,'!|:;]/.test(c)
            ? 0.3
            : /[MW@%]/.test(c)
              ? 0.95
              : /\s/.test(c)
                ? 0.28
                : /[A-Z]/.test(c)
                  ? 0.7
                  : 0.56),
        0,
      ),
    max = limit * 0.55;
  const words = text.split(/\s+/),
    lines = [];
  let line = "";
  for (let word of words) {
    while (width(word) > max) {
      if (line) {
        lines.push(line);
        line = "";
      }
      let cut = 1;
      while (cut < word.length && width(word.slice(0, cut + 1)) <= max) cut++;
      lines.push(word.slice(0, cut));
      word = word.slice(cut);
    }
    if (width((line + " " + word).trim()) > max) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}
export function challengeSVG(card) {
  const category = CATEGORIES.find((c) => c.id === card.category);
  let y = 190;
  const lines = (text, size, limit, weight = 400) =>
    wrap(text, limit)
      .map((line) => {
        y += size * 1.35;
        return `<text x="64" y="${y}" font-size="${size}" font-weight="${weight}">${escapeXML(line)}</text>`;
      })
      .join("");
  const title = lines(card.title, 44, 26, 700);
  y += 32;
  const steps = card.steps
    .map((s, i) => {
      const body = lines(`${i + 1}. ${s}`, 25, 48);
      y += 14;
      return body;
    })
    .join("");
  const height = Math.max(740, y + 150);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}"><rect width="800" height="${height}" rx="36" fill="#f7f5f0"/><rect x="32" y="32" width="736" height="10" rx="5" fill="#3243c9"/><g fill="#28233c" font-family="Arial, sans-serif"><text x="64" y="100" font-size="20" font-weight="700">BOREDOM ROULETTE</text><rect x="64" y="132" width="672" height="44" rx="22" fill="${category.color}"/><text x="86" y="161" font-size="20">${category.name} · ${card.minutes} MIN · ${escapeXML(card.materials)}</text>${title}${steps}<text x="64" y="${height - 85}" font-size="19" font-weight="700">A small spin. A better story.</text><text x="64" y="${height - 50}" font-size="17">Designed &amp; developed by Noorullah Adel · 2026</text></g></svg>`;
}
