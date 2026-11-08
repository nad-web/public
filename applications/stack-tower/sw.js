/* Copyright (c) 2026 Noorullah Adel. MIT. */
const RELEASE = "1.0.0-d5cc0a243cf16201",
  CORE = [
  {
    "path": "LICENSE",
    "integrity": "sha256-+ir+B5YTMxJhtM2WkRjfOBF2rhuoOunKYdW0JA3tsuQ="
  },
  {
    "path": "THIRD_PARTY_NOTICES.md",
    "integrity": "sha256-QuHdG2EFP2SWbc9YWtIq3iCIcmZm2Txj9ogxgN8CHcI="
  },
  {
    "path": "assets/apple-touch-icon.png",
    "integrity": "sha256-dzcqW3I5gdZQNqLGEsAo8055KV9zaoyIRfhLZWuQfXI="
  },
  {
    "path": "assets/icon-192.png",
    "integrity": "sha256-hTu8mGQwqR4kJ6wBbnyK6tdB6iDbUcvGGHLmBYIvgOA="
  },
  {
    "path": "assets/icon-512.png",
    "integrity": "sha256-+pyXk2dEg9tg7dJMlpNW5VHeN56ftpqSHBvGjAC9r2g="
  },
  {
    "path": "assets/icon-maskable-512.png",
    "integrity": "sha256-+pyXk2dEg9tg7dJMlpNW5VHeN56ftpqSHBvGjAC9r2g="
  },
  {
    "path": "assets/icon.svg",
    "integrity": "sha256-l+JbwjGQjCEZUfbFYgYeBAmNkPOgzLglJIXyOEM4818="
  },
  {
    "path": "index.html",
    "integrity": "sha256-F3Vj4NFWdo1ZeyFJdo/BlgshuPGuI+4lwL077NnqE1w="
  },
  {
    "path": "manifest.webmanifest",
    "integrity": "sha256-RXhE9to7ghvx/vt4bkbImK+3B1d8t0AQhW1pFB1TK1E="
  },
  {
    "path": "src/app.js",
    "integrity": "sha256-ml5rKwb30DJG+EECd34S3Bqca4YSaGnoZh0cezyKsY8="
  },
  {
    "path": "src/audio.js",
    "integrity": "sha256-iIW8lWISkN1c1lH4/3MflVKq3P/gqzH2tHYD/3FmZPM="
  },
  {
    "path": "src/engine.js",
    "integrity": "sha256-ue+1LvRQ7U/XFyPez8kWVdzbeR+Bk8pQA8crCprb0ro="
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
    "path": "src/render.js",
    "integrity": "sha256-Nan3fGL7AqX3MxzoJ7Y8uVVaEVhozEqdU9r85YoLofc="
  },
  {
    "path": "src/storage.js",
    "integrity": "sha256-nP04MWHmrwCtLEYA1qtW1tUgZhbMGtCcn0YiXTURCB8="
  },
  {
    "path": "src/styles.css",
    "integrity": "sha256-gTfo8BI3VSxuek9hj4GpoicR140tXTLQ9xdVKj8mkec="
  },
  {
    "path": "src/ui.js",
    "integrity": "sha256-vTa2L8HsEA0Kr7l92MBA4YC9MMZ0h558Tz0nln+fOpo="
  }
],
  SCOPE = self.registration.scope,
  ROOT = new URL(SCOPE),
  PREFIX = "noorullah-stack-tower:" + ROOT.origin + ROOT.pathname + ":",
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
          "Open Stack Tower online once to finish saving its files.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
