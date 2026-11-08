import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, compileWorker } from "./update-cache.mjs";
const html = await fs.readFile(path.join(ROOT, "index.html"), "utf8");
if (!/name="viewport"/.test(html) || !html.includes("Noorullah Adel"))
  throw Error("Missing viewport or branding");
for (const m of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
  if (!m[1].startsWith("./")) throw Error("Escaping app reference: " + m[1]);
  await fs.access(path.resolve(ROOT, m[1]));
}
const manifest = JSON.parse(
  await fs.readFile(path.join(ROOT, "manifest.webmanifest"), "utf8"),
);
for (const key of ["id", "start_url", "scope"])
  if (manifest[key] !== "./") throw Error("Non-relative manifest " + key);
if (manifest.display !== "standalone")
  throw Error("Missing standalone display");
for (const icon of manifest.icons) await fs.access(path.join(ROOT, icon.src));
for (const file of await fs.readdir(path.join(ROOT, "src")))
  if (file.endsWith(".js")) {
    const result = spawnSync(
      process.execPath,
      ["--check", path.join(ROOT, "src", file)],
      { encoding: "utf8" },
    );
    if (result.status !== 0) throw Error(result.stderr);
  }
const release = await compileWorker();
if ((await fs.readFile(path.join(ROOT, "sw.js"), "utf8")) !== release.source)
  throw Error("Run node scripts/update-cache.mjs after editing runtime files");
console.log(
  `Dino Runner: relative files, manifest, branding, syntax and ${release.files.length} integrity-checked offline assets verified.`,
);
