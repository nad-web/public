/* Copyright (c) 2026 Noorullah Adel. MIT. */
const RELEASE = "1.0.0-d61706bc96cb28ae",
  CORE = [
  {
    "path": "LICENSE",
    "integrity": "sha256-+ir+B5YTMxJhtM2WkRjfOBF2rhuoOunKYdW0JA3tsuQ="
  },
  {
    "path": "THIRD_PARTY_NOTICES.md",
    "integrity": "sha256-0ofvEt5YNtMCvK8zAlDD7Z6196NNmYHS/P3bbGnuz28="
  },
  {
    "path": "assets/apple-touch-icon.png",
    "integrity": "sha256-jhF9GnW9/E3O8f0OP3h5HWdTwo1QtzwVslNSxDSY62Q="
  },
  {
    "path": "assets/icon-192.png",
    "integrity": "sha256-Z7V445wDxILXrR4DyOfq+GUv4VJx05lruITV8wZYFt0="
  },
  {
    "path": "assets/icon-512.png",
    "integrity": "sha256-QAzJd5XM1rluYSoSiXcJUP+hvD00JlyX4eES+4zYfmI="
  },
  {
    "path": "assets/icon-maskable-512.png",
    "integrity": "sha256-QAzJd5XM1rluYSoSiXcJUP+hvD00JlyX4eES+4zYfmI="
  },
  {
    "path": "assets/icon.svg",
    "integrity": "sha256-gg/qfBtAiThIJE0+bCn1Lmtz3/BWm/+XFMPe9XmbYwY="
  },
  {
    "path": "index.html",
    "integrity": "sha256-0LpDHSx8iwQqQZYIvfhy4VPF6ZHmDLnedur6VILXdxc="
  },
  {
    "path": "manifest.webmanifest",
    "integrity": "sha256-TUZrI1JtJ8u686dBT6dpPT+zdmXE3wSjyACl8KsMIZA="
  },
  {
    "path": "src/app.js",
    "integrity": "sha256-+wKKhfBOLxPf8zZ6rr0SmFIiGu5l61diG5LZgtF84oU="
  },
  {
    "path": "src/audio.js",
    "integrity": "sha256-LUD7xeoCrnfBpmQPH1iOyUQh/JDu2LqFlAu1QO/jl+Q="
  },
  {
    "path": "src/challenges.js",
    "integrity": "sha256-g66ibGjsi2mByrwAL/B+sZ8fMx0J1KhPZLYf7y7qSCI="
  },
  {
    "path": "src/engine.js",
    "integrity": "sha256-x4Oj6PaqXg7REMexEttd5M8f3L/L+X3x7cMTOv+3nVw="
  },
  {
    "path": "src/pwa.js",
    "integrity": "sha256-ZZ0D+HYez7yFCGWGK9qqHCNlqyJYBfEgVLFmIL/DjrU="
  },
  {
    "path": "src/share.js",
    "integrity": "sha256-7/B95+5y2ovuwChMMJV76xuaLJzYf9H4tfRo077bd3U="
  },
  {
    "path": "src/storage.js",
    "integrity": "sha256-nP04MWHmrwCtLEYA1qtW1tUgZhbMGtCcn0YiXTURCB8="
  },
  {
    "path": "src/styles.css",
    "integrity": "sha256-rNX/xCs6T96vmk8RxLSMHcA+ntVBRG34p5GKFtBy/Pc="
  }
],
  SCOPE = self.registration.scope,
  ROOT = new URL(SCOPE),
  PREFIX = "noorullah-boredom-roulette:" + ROOT.origin + ROOT.pathname + ":",
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
          "Open Boredom Roulette online once to finish saving its files.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
