/* Copyright (c) 2026 Noorullah Adel. MIT. */
const RELEASE = "1.0.0-d014fb7192cd9853",
  CORE = [
  {
    "path": "LICENSE",
    "integrity": "sha256-+ir+B5YTMxJhtM2WkRjfOBF2rhuoOunKYdW0JA3tsuQ="
  },
  {
    "path": "THIRD_PARTY_NOTICES.md",
    "integrity": "sha256-/rw4MI3DesrCj+ixcLMggIeXHrKoaFo3a2cPWAnb2No="
  },
  {
    "path": "assets/apple-touch-icon.png",
    "integrity": "sha256-2b8dnaVhpdPXPfdU0WzZCsib+uO//ApfeCWo6T4GOJg="
  },
  {
    "path": "assets/cat-icon.svg",
    "integrity": "sha256-WAjleJm+cGF2loc/ovEKnmCPGuxw1Rp4PdqG106PyNk="
  },
  {
    "path": "assets/icon-192.png",
    "integrity": "sha256-aWl/RcRXFLPZD/w6zS5vANrUDwA2DwcoCQWLtCa1V7c="
  },
  {
    "path": "assets/icon-512.png",
    "integrity": "sha256-FaMwik+L/7TY5m2GsXIzr7NVNUvCMtnt9cRM/Ml47Nc="
  },
  {
    "path": "assets/icon-maskable-512.png",
    "integrity": "sha256-FaMwik+L/7TY5m2GsXIzr7NVNUvCMtnt9cRM/Ml47Nc="
  },
  {
    "path": "index.html",
    "integrity": "sha256-qsqxlsXxa/Jg5o77G5DuDQaVY52OJ+4vM1A5tY8N+OQ="
  },
  {
    "path": "manifest.webmanifest",
    "integrity": "sha256-eb13Ddb11pnwSaFjwdijk9k/NRnCecdBBGRjnOrKYio="
  },
  {
    "path": "src/app.js",
    "integrity": "sha256-9b8NrvcufJT06DTK+Dv6+A4hDD2aXiH/7raVhRRlBi0="
  },
  {
    "path": "src/audio.js",
    "integrity": "sha256-wf2XjW2HLNeQBmpTS+aB+uiH2/2BxhXmz60zdHAF7OQ="
  },
  {
    "path": "src/engine.js",
    "integrity": "sha256-PdL79faserLP++e7nxvFQ8OOeRryVX2+pfmdYOq55xU="
  },
  {
    "path": "src/pwa.js",
    "integrity": "sha256-kz1pI6rCK+zRL/WxVDEIgfzY89+rwMM/9oTeaGz6SbQ="
  },
  {
    "path": "src/render.js",
    "integrity": "sha256-7fFLvqnEjt44T5W3DbWVGaV/+/2AaaNzng8BMTBdlMs="
  },
  {
    "path": "src/storage.js",
    "integrity": "sha256-vqLo2hyLgSiBzWjEIl2XP8VKqV2aEe55l1UXsNlb4dY="
  },
  {
    "path": "src/styles.css",
    "integrity": "sha256-dxysb/48YDsyHyVPXuXlZDDPIcS61vM4a0H20SDJhEE="
  }
],
  SCOPE = self.registration.scope,
  ROOT = new URL(SCOPE),
  PREFIX = "noorullah-rooftop-cat:" + ROOT.origin + ROOT.pathname + ":",
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
          "Open Rooftop Cat online once to finish saving its files.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
