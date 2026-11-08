import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export async function assets(root = ROOT) {
  const files = [
    "index.html",
    "manifest.webmanifest",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
  ];
  async function walk(dir) {
    for (const entry of await fs.readdir(path.join(root, dir), {
      withFileTypes: true,
    })) {
      const file = dir + "/" + entry.name;
      if (entry.isSymbolicLink()) throw Error("Symlinks unsupported");
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  await walk("src");
  await walk("assets");
  return files.sort();
}
export async function compileWorker(root = ROOT) {
  const files = await assets(root),
    hash = createHash("sha256"),
    core = [];
  for (const file of files) {
    const bytes = await fs.readFile(path.join(root, file));
    hash.update(file);
    hash.update(bytes);
    core.push({
      path: file,
      integrity:
        "sha256-" + createHash("sha256").update(bytes).digest("base64"),
    });
  }
  const release = "1.0.0-" + hash.digest("hex").slice(0, 16),
    template = await fs.readFile(
      path.join(root, "scripts/cache-template.js"),
      "utf8",
    );
  return {
    release,
    files,
    source: template
      .replace("__RELEASE__", release)
      .replace("__CORE__", JSON.stringify(core, null, 2)),
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = await compileWorker();
  await fs.writeFile(path.join(ROOT, "sw.js"), result.source);
  console.log(`${result.release}: ${result.files.length} offline files`);
}
