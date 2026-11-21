/* Copyright (c) 2026 Noorullah Adel. MIT. */
const RELEASE = "__RELEASE__",
  CORE = __CORE__,
  MARKUP = __MARKUP__,
  SCOPE = self.registration.scope,
  ROOT = new URL(SCOPE),
  PREFIX = "noorullah-dayline-dispatch:" + ROOT.origin + ROOT.pathname + ":",
  CACHE = PREFIX + RELEASE;
// Some static hosts decorate navigation documents and SVGs in transit.
// Store the release’s canonical markup beside its byte-verified runtime assets.
async function prepare(cache, missingOnly = false) {
  const network = [];
  for (const file of CORE) {
    const url = new URL(file.path, SCOPE).href;
    if (missingOnly && (await cache.match(url))) continue;
    const built = MARKUP[file.path];
    if (built) {
      await cache.put(
        url,
        new Response(built.text, { headers: { "Content-Type": built.type } }),
      );
    } else {
      network.push(
        new Request(url, {
          cache: "reload",
          credentials: "same-origin",
          integrity: file.integrity,
        }),
      );
    }
  }
  if (network.length) await cache.addAll(network);
}
async function complete() {
  const cache = await caches.open(CACHE);
  return (
    await Promise.all(CORE.map((f) => cache.match(new URL(f.path, SCOPE).href)))
  ).every(Boolean);
}
self.addEventListener("install", (e) =>
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        await prepare(cache);
        if (!(await complete())) throw Error("Incomplete game cache");
      } catch (error) {
        await caches.delete(CACHE);
        throw error;
      }
      if (!self.registration.active) await self.skipWaiting();
    })(),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (!["CHECK_READY", "REPAIR_CACHE"].includes(e.data?.type)) return;
  e.waitUntil(
    (async () => {
      try {
        if (e.data.type === "REPAIR_CACHE") {
          const cache = await caches.open(CACHE);
          await prepare(cache, true);
        }
        e.ports[0]?.postMessage({ ready: await complete(), release: RELEASE });
      } catch {
        e.ports[0]?.postMessage({ ready: false, release: RELEASE });
      }
    })(),
  );
});
self.addEventListener("fetch", (e) => {
  const request = e.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE),
        entry =
          url.pathname === ROOT.pathname ||
          url.pathname === ROOT.pathname + "index.html",
        stored = await cache.match(
          entry ? new URL("index.html", SCOPE).href : url.href,
          { ignoreSearch: true },
        );
      if (stored) return stored;
      try {
        return await fetch(request);
      } catch {
        return new Response(
          "Open Dayline Dispatch online once to finish saving its files.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
