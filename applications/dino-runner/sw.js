/* Copyright (c) 2026 Noorullah Adel. MIT. */
const RELEASE = "1.0.0-c97dda22316ea1a8",
  CORE = [
  {
    "path": "LICENSE",
    "integrity": "sha256-+ir+B5YTMxJhtM2WkRjfOBF2rhuoOunKYdW0JA3tsuQ="
  },
  {
    "path": "THIRD_PARTY_NOTICES.md",
    "integrity": "sha256-pzT7R03cfOezVW1iIIZ17xCVhOzfQizXIiOWjzymXlI="
  },
  {
    "path": "assets/apple-touch-icon.png",
    "integrity": "sha256-BpV8D/wseSE2hsIJMwlkLk+AS0VwytS0qo/ajaF1ZFQ="
  },
  {
    "path": "assets/icon-192.png",
    "integrity": "sha256-tO1gM6X+MsFFiiX3MBSLnEdqh8bnjk47rXdeTZCoceA="
  },
  {
    "path": "assets/icon-512.png",
    "integrity": "sha256-PsQnnSjZDBd6F2FQlwP0pwlaq/l1rQ2myY5NE6D2y3k="
  },
  {
    "path": "assets/icon-maskable-512.png",
    "integrity": "sha256-PsQnnSjZDBd6F2FQlwP0pwlaq/l1rQ2myY5NE6D2y3k="
  },
  {
    "path": "assets/icon.svg",
    "integrity": "sha256-y5LY0XqySKScIGm+PtXUh/x6XwZI5T8vYeWVvMNBSXM="
  },
  {
    "path": "index.html",
    "integrity": "sha256-6H2EEy6HvSHFrgPL3iY1VnEh9k3FCPbPR3qPRhfIUXQ="
  },
  {
    "path": "manifest.webmanifest",
    "integrity": "sha256-/NhIXTwmEH+Fn1Z+LI9q9NxJ0+CH/kxghhJJMlxxn50="
  },
  {
    "path": "src/app.js",
    "integrity": "sha256-m1xQQup6rwyDw/E8mBf1L9QcLTz3yJlWrK+osXAe0uo="
  },
  {
    "path": "src/audio.js",
    "integrity": "sha256-iIW8lWISkN1c1lH4/3MflVKq3P/gqzH2tHYD/3FmZPM="
  },
  {
    "path": "src/engine.js",
    "integrity": "sha256-aI9Yy3UrcqZ/OUtN/FAsS/2D26IMMA5+eaUntIEuICI="
  },
  {
    "path": "src/pwa.js",
    "integrity": "sha256-g+A15Jc3KJ/K8fV9Vg4C9DxxpQXX1q9CTaNOaMNQU2E="
  },
  {
    "path": "src/records.js",
    "integrity": "sha256-eVQy7FC8uMi1jIpIf7PnxvFnpx/Yb12FsXvJknl4Qk0="
  },
  {
    "path": "src/render.js",
    "integrity": "sha256-14Nh5AgixfsqEL0QrGz1E2YVraoWO4zfHMUu+P0uh9c="
  },
  {
    "path": "src/sprites.js",
    "integrity": "sha256-u7AhSY/dQLebEdiFXiFbjVTuSJAtvSOMUFDQD5Q712s="
  },
  {
    "path": "src/storage.js",
    "integrity": "sha256-nP04MWHmrwCtLEYA1qtW1tUgZhbMGtCcn0YiXTURCB8="
  },
  {
    "path": "src/styles.css",
    "integrity": "sha256-szV+EWPNE/Om+EMUnmnLviFebsUwurBahz7YpsIs5YU="
  }
],
  SCOPE = self.registration.scope,
  ROOT = new URL(SCOPE),
  PREFIX = "noorullah-dino-runner:" + ROOT.origin + ROOT.pathname + ":",
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
          "Open Dino Runner online once to finish saving its files.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
