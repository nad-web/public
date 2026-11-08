/* Copyright (c) 2026 Noorullah Adel. MIT. */
const RELEASE = "1.0.0-0d5e376b390ae2f0",
  CORE = [
  {
    "path": "LICENSE",
    "integrity": "sha256-+ir+B5YTMxJhtM2WkRjfOBF2rhuoOunKYdW0JA3tsuQ="
  },
  {
    "path": "THIRD_PARTY_NOTICES.md",
    "integrity": "sha256-LyEUPhVhuST6AxsXu8Wlf3tFwW25Vy1fd6E3uxEPUGk="
  },
  {
    "path": "assets/apple-touch-icon.png",
    "integrity": "sha256-biBPRhNxpk8hqZ412kyA03LUxrkUAIzjDV73JFL2MI0="
  },
  {
    "path": "assets/icon-192.png",
    "integrity": "sha256-M86nVVdHN393Xry6vffXSrYWDsCuFgAUwCoTx6so6Ls="
  },
  {
    "path": "assets/icon-512.png",
    "integrity": "sha256-nVFJRapWdo9mIheDsuuM++DRAUIfpQPPRGjmQmrZxoI="
  },
  {
    "path": "assets/icon-maskable-512.png",
    "integrity": "sha256-nVFJRapWdo9mIheDsuuM++DRAUIfpQPPRGjmQmrZxoI="
  },
  {
    "path": "assets/icon.svg",
    "integrity": "sha256-XKdC75vnuyFETJCfs0G9Ih31qqqK3Z/LmIeYizZ3pdQ="
  },
  {
    "path": "index.html",
    "integrity": "sha256-Qomgo1jcTBOUaXq/DzdiyKxBuSBiGnbz3bQzf7rMFiA="
  },
  {
    "path": "manifest.webmanifest",
    "integrity": "sha256-dUuj7AfsFRK8G/4mSczBTKQ7+iSfHt7thyr60zrmG28="
  },
  {
    "path": "src/app.js",
    "integrity": "sha256-OhlNqKE7VbNa1XtGLx69+bRhhnTOHZYepP9+oC7b+8M="
  },
  {
    "path": "src/audio.js",
    "integrity": "sha256-iIW8lWISkN1c1lH4/3MflVKq3P/gqzH2tHYD/3FmZPM="
  },
  {
    "path": "src/engine.js",
    "integrity": "sha256-75MVjHH1f2CXT5d19xelMUYEwDV3+ndK/ovxiVYjO9k="
  },
  {
    "path": "src/fullscreen.js",
    "integrity": "sha256-avpMalf73iquWjZiCJdgJ5hsUdyQlxR6hcB2YU6Ebms="
  },
  {
    "path": "src/pwa.js",
    "integrity": "sha256-fZ+jKOBs3Hz75Dfjt8CJuutT3+EclMO0EO1ayV/roZw="
  },
  {
    "path": "src/records.js",
    "integrity": "sha256-VEk1wz5KNePGMLIG2sgYQDMGVQUdaQgOWLUTdfNRiNw="
  },
  {
    "path": "src/storage.js",
    "integrity": "sha256-nP04MWHmrwCtLEYA1qtW1tUgZhbMGtCcn0YiXTURCB8="
  },
  {
    "path": "src/styles.css",
    "integrity": "sha256-1HG0ZWprdJBZG4v7NqxnVEgeYn7pFRyamUMrjZY3ZhA="
  },
  {
    "path": "src/ui.js",
    "integrity": "sha256-vTa2L8HsEA0Kr7l92MBA4YC9MMZ0h558Tz0nln+fOpo="
  },
  {
    "path": "src/words.js",
    "integrity": "sha256-LK9QzhmZ6WclwFtzF/ZM29x/KkF7EF/eMnJrAjb8jFU="
  }
],
  SCOPE = self.registration.scope,
  ROOT = new URL(SCOPE),
  PREFIX = "noorullah-word-scramble:" + ROOT.origin + ROOT.pathname + ":",
  CACHE = PREFIX + RELEASE;
const requests = () =>
  CORE.map(
    (f) =>
      new Request(new URL(f.path, SCOPE), {
        cache: "reload",
        credentials: "same-origin",
        integrity: f.integrity,
      }),
  );
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
        await cache.addAll(requests());
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
          const cache = await caches.open(CACHE),
            missing = [];
          for (const request of requests())
            if (!(await cache.match(request))) missing.push(request);
          if (missing.length) await cache.addAll(missing);
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
          "Open Word Scramble online once to finish saving its files.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
