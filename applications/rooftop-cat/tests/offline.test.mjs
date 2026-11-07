import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { ROOT, compileWorker } from "../scripts/update-cache.mjs";
async function worker({
  active = null,
  failed = null,
  scope = "https://example.test/public/applications/rooftop-cat/",
} = {}) {
  const events = new Map(),
    stores = new Map(),
    state = { online: true, skipped: 0, claimed: 0 };
  async function network(request) {
    if (!state.online) throw Error("offline");
    const url = new URL(typeof request === "string" ? request : request.url),
      relative = decodeURIComponent(
        url.pathname.slice(new URL(scope).pathname.length),
      );
    if (relative === failed) throw Error("failed asset");
    const bytes = await fs.readFile(path.join(ROOT, relative));
    if (request.integrity)
      assert.equal(
        request.integrity,
        "sha256-" + createHash("sha256").update(bytes).digest("base64"),
      );
    return new Response(bytes);
  }
  const cache = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const data = stores.get(name);
    return {
      async addAll(requests) {
        const prepared = await Promise.all(
          requests.map(async (r) => [r.url, await network(r)]),
        );
        for (const [url, response] of prepared) data.set(url, response);
      },
      async match(request, options = {}) {
        let url = typeof request === "string" ? request : request.url;
        if (options.ignoreSearch) {
          const parsed = new URL(url);
          parsed.search = "";
          url = parsed.href;
        }
        return data.get(url)?.clone();
      },
    };
  };
  const caches = {
    open: async (n) => cache(n),
    keys: async () => [...stores.keys()],
    delete: async (n) => stores.delete(n),
  };
  const context = vm.createContext({
    URL,
    Request,
    Response,
    caches,
    fetch: network,
    self: {
      registration: { scope, active },
      clients: { claim: async () => state.claimed++ },
      skipWaiting: async () => state.skipped++,
      addEventListener: (t, h) => events.set(t, h),
    },
  });
  vm.runInContext(await fs.readFile(path.join(ROOT, "sw.js"), "utf8"), context);
  async function lifecycle(type) {
    let pending;
    events.get(type)({ waitUntil: (v) => (pending = v) });
    await pending;
  }
  async function message(type) {
    let pending, result;
    events.get("message")({
      data: { type },
      ports: [{ postMessage: (v) => (result = v) }],
      waitUntil: (v) => (pending = v),
    });
    await pending;
    return result;
  }
  async function request(url, { mode = "cors", method = "GET" } = {}) {
    let response;
    events.get("fetch")({
      request: { url, mode, method },
      respondWith: (v) => (response = v),
    });
    return response ? await response : undefined;
  }
  return { stores, state, scope, lifecycle, message, request };
}
test("worker is generated from current runtime bytes and contains only app-local files", async () => {
  const built = await compileWorker();
  assert.equal(
    await fs.readFile(path.join(ROOT, "sw.js"), "utf8"),
    built.source,
  );
  assert(
    built.files.every(
      (f) => !f.startsWith("/") && !f.includes("..") && !/^https?:/.test(f),
    ),
  );
  assert(built.files.includes("assets/apple-touch-icon.png"));
  assert(built.files.includes("src/audio.js"));
  assert(!built.files.some((f) => f.startsWith("tests/")));
});
test("complete precache supports offline entry URLs and executable modules", async () => {
  const w = await worker();
  await w.lifecycle("install");
  assert.equal(w.state.skipped, 1);
  await w.lifecycle("activate");
  assert.equal((await w.message("CHECK_READY")).ready, true);
  w.state.online = false;
  for (const route of [
    w.scope,
    w.scope + "?from=homescreen",
    w.scope + "index.html",
  ]) {
    const r = await w.request(route, { mode: "navigate" });
    assert.equal(r.status, 200);
    assert((await r.text()).includes("Noorullah Adel"));
  }
  assert(
    (await (await w.request(w.scope + "src/engine.js")).text()).includes(
      "createGame",
    ),
  );
  assert.equal((await w.request(w.scope + "missing.bin")).status, 503);
});
test("activation cleans this exact app scope while preserving other apps", async () => {
  const w = await worker();
  w.stores.set("sankey:keep", new Map());
  w.stores.set(
    "noorullah-rooftop-cat:https://example.test/another/rooftop-cat/:keep",
    new Map(),
  );
  w.stores.set("noorullah-rooftop-cat:" + w.scope + ":old", new Map());
  await w.lifecycle("install");
  await w.lifecycle("activate");
  assert(w.stores.has("sankey:keep"));
  assert(
    w.stores.has(
      "noorullah-rooftop-cat:https://example.test/another/rooftop-cat/:keep",
    ),
  );
  assert(!w.stores.has("noorullah-rooftop-cat:" + w.scope + ":old"));
  assert.equal(
    await w.request("https://example.test/public/applications/sankey-diagram/"),
    undefined,
  );
  assert.equal(
    await w.request("https://other.test/public/applications/rooftop-cat/"),
    undefined,
  );
  assert.equal(await w.request(w.scope, { method: "POST" }), undefined);
});
test("failed preparation is rejected and cannot claim offline readiness", async () => {
  const w = await worker({ failed: "src/audio.js" });
  w.stores.set("unrelated", new Map());
  await assert.rejects(() => w.lifecycle("install"));
  assert.deepEqual([...w.stores.keys()], ["unrelated"]);
  assert.equal(w.state.skipped, 0);
  assert.equal((await w.message("CHECK_READY")).ready, false);
});
test("missing files are reported and repaired online; update activation is explicit", async () => {
  const w = await worker({ active: {} });
  await w.lifecycle("install");
  assert.equal(w.state.skipped, 0);
  await w.lifecycle("activate");
  w.stores.get([...w.stores.keys()][0]).delete(w.scope + "src/render.js");
  assert.equal((await w.message("CHECK_READY")).ready, false);
  w.state.online = false;
  assert.equal((await w.message("REPAIR_CACHE")).ready, false);
  w.state.online = true;
  assert.equal((await w.message("REPAIR_CACHE")).ready, true);
  await w.message("SKIP_WAITING");
  assert.equal(w.state.skipped, 1);
});
test("manifest and worker remain usable when moved to a different repository prefix", async () => {
  const m = JSON.parse(
    await fs.readFile(path.join(ROOT, "manifest.webmanifest"), "utf8"),
  );
  for (const k of ["scope", "id", "start_url"]) assert.equal(m[k], "./");
  assert.equal(m.display, "standalone");
  const w = await worker({
    scope: "https://example.test/another-repo/rooftop-cat/",
  });
  await w.lifecycle("install");
  w.state.online = false;
  assert.equal((await w.request(w.scope, { mode: "navigate" })).status, 200);
});
