/* Copyright (c) 2026 Noorullah Adel. MIT. */
const RELEASE = "1.0.0-93584db2c1aee60f",
  CORE = [
  {
    "path": "LICENSE",
    "integrity": "sha256-+ir+B5YTMxJhtM2WkRjfOBF2rhuoOunKYdW0JA3tsuQ="
  },
  {
    "path": "THIRD_PARTY_NOTICES.md",
    "integrity": "sha256-HLmdtGikSx5eeuJGnTPOgYK03fdUnz3RdD+GQB/oTMU="
  },
  {
    "path": "assets/apple-touch-icon.png",
    "integrity": "sha256-QgLS84gxWIchc9Uv1oFDKhKpr4EKPQYolSUSYNh9Sms="
  },
  {
    "path": "assets/icon-192.png",
    "integrity": "sha256-+hYYby5r8KXtVRc1L5kBK5i8qnz/F3g5CZsRrCYc13w="
  },
  {
    "path": "assets/icon-512.png",
    "integrity": "sha256-J2evzSvtpe/11Vp6j2ONRYsWqku7zSlsrCppxfiY8NY="
  },
  {
    "path": "assets/icon-maskable-512.png",
    "integrity": "sha256-0OqpstdkkL1IreE6btRrlmwtWuPfbLViNDZYTZoOWZA="
  },
  {
    "path": "assets/icon.svg",
    "integrity": "sha256-IqQHZn1Jj50tr4uZPOb3x+X9mbX/XnmjF6Kfr0k3h0M="
  },
  {
    "path": "assets/type/BarlowCondensed-Bold.ttf",
    "integrity": "sha256-5HZWLsnB4WzxZHWJW1EfCMgE9DjMmp+ApE6lCg7rW2U="
  },
  {
    "path": "assets/type/OFL.txt",
    "integrity": "sha256-GG11DrSWpMF6djhfgr5q6irBzy3gdKgR1jeGzzdOpz8="
  },
  {
    "path": "index.html",
    "integrity": "sha256-avgQQDGggYqcA/wA0Y3VrmK0AoCRarQ+AEEo/CAExCE="
  },
  {
    "path": "manifest.webmanifest",
    "integrity": "sha256-JTqRpHSkC93tTSBd5/glSycoAhIV0yCldkJxafQn2dc="
  },
  {
    "path": "src/app.js",
    "integrity": "sha256-sKzsuaukZXTbqqvw3nU9Flee+P7vA1/kVtFfiAkQyyo="
  },
  {
    "path": "src/audio.js",
    "integrity": "sha256-qGNvfIOwfGCjIH/441L+QeEcYh0/JAFUA0n9JdTvwfI="
  },
  {
    "path": "src/cities.js",
    "integrity": "sha256-4BYcZZDNAy7ZMplqpbuTjSw9L7poqXQHoD48Y7phuYs="
  },
  {
    "path": "src/engine.js",
    "integrity": "sha256-Q+rkedJRdNMAWxYEqCNdkBiSh8ZWKrFdg7LhtB4z42U="
  },
  {
    "path": "src/fullscreen.js",
    "integrity": "sha256-orOJmSvw1h3V/Ls0M0oUOGp7xe5JCNR5SCV9NmAj3C0="
  },
  {
    "path": "src/map.js",
    "integrity": "sha256-Z0J6yJr26+Z7xr9M/YMnqHXi9z+Cbcy8QKRysRy9MdE="
  },
  {
    "path": "src/panels.js",
    "integrity": "sha256-4v8qfZflgGsv2K52oLBqRAeb8+TEOsCVwky35DBG84Q="
  },
  {
    "path": "src/pwa.js",
    "integrity": "sha256-CBvdL6GQTL0EBUt+EmgAqSVECmY1LECoLT/HE+LN2YA="
  },
  {
    "path": "src/records.js",
    "integrity": "sha256-Oroe/EKQvGgjYxNW1ONWSTZcxY4yBaDWMSq635ZeMg8="
  },
  {
    "path": "src/storage.js",
    "integrity": "sha256-nP04MWHmrwCtLEYA1qtW1tUgZhbMGtCcn0YiXTURCB8="
  },
  {
    "path": "src/styles.css",
    "integrity": "sha256-gLjE7oFjXYebAS+XVdoIN87KgllSb9hoPRpsWHcqYd4="
  }
],
  MARKUP = {"assets/icon.svg":{"type":"image/svg+xml","text":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\" role=\"img\" aria-label=\"Dayline Dispatch\">\n  <rect width=\"48\" height=\"48\" rx=\"11\" fill=\"#ecbd69\"/>\n  <path d=\"M6 33h14l7-12h14\" fill=\"none\" stroke=\"#143c3c\" stroke-width=\"3\" stroke-linejoin=\"round\"/>\n  <g fill=\"#ecbd69\" stroke=\"#143c3c\" stroke-width=\"2.4\"><circle cx=\"11\" cy=\"33\" r=\"3.6\"/><circle cx=\"36\" cy=\"21\" r=\"3.6\"/></g>\n  <path d=\"M9 23a8 8 0 0 1 16 0z\" fill=\"#a7412f\"/><path d=\"M9 26h14\" stroke=\"#143c3c\" stroke-width=\"1.5\"/>\n</svg>\n"},"index.html":{"type":"text/html; charset=utf-8","text":"<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta\n      name=\"viewport\"\n      content=\"width=device-width, initial-scale=1, viewport-fit=cover\"\n    />\n    <meta name=\"theme-color\" content=\"#143c3c\" />\n    <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />\n    <meta\n      name=\"apple-mobile-web-app-status-bar-style\"\n      content=\"black-translucent\"\n    />\n    <meta\n      name=\"description\"\n      content=\"A pocket transit game. Run three tram lines, clear rush-hour queues and earn dispatch tickets in three original cities. Developed and designed by Noorullah Adel.\"\n    />\n    <title>Dayline Dispatch · Noorullah’s Build Lab</title>\n    <link rel=\"icon\" href=\"./assets/icon.svg\" type=\"image/svg+xml\" />\n    <link rel=\"apple-touch-icon\" href=\"./assets/apple-touch-icon.png\" />\n    <link rel=\"manifest\" href=\"./manifest.webmanifest\" />\n    <link rel=\"stylesheet\" href=\"./src/styles.css\" />\n    <script type=\"module\" src=\"./src/app.js\"></script>\n  </head>\n  <body>\n    <svg\n      xmlns=\"http://www.w3.org/2000/svg\"\n      class=\"definitions\"\n      aria-hidden=\"true\"\n    >\n      <defs>\n        <symbol\n          id=\"ic-tram\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <rect x=\"5\" y=\"3\" width=\"14\" height=\"15\" rx=\"4\" />\n          <path d=\"M7 8h10M8 3l2-2h4m-7 20 2-3m8 3-2-3\" />\n          <circle cx=\"9\" cy=\"14\" r=\"1\" />\n          <circle cx=\"15\" cy=\"14\" r=\"1\" />\n        </symbol>\n        <symbol\n          id=\"ic-sound\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path\n            d=\"M3 9h4l5-4v14l-5-4H3zM16 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12\"\n          />\n        </symbol>\n        <symbol\n          id=\"ic-mute\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M3 9h4l5-4v14l-5-4H3zM16 9l5 6m0-6-5 6\" />\n        </symbol>\n        <symbol\n          id=\"ic-help\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <circle cx=\"12\" cy=\"12\" r=\"9\" />\n          <path d=\"M9 9a3 3 0 1 1 4.4 2.6c-1.4.7-1.4 1.3-1.4 2.5m0 3h.01\" />\n        </symbol>\n        <symbol\n          id=\"ic-gear\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M3 7h7m4 0h7M3 17h11m4 0h3\" />\n          <circle cx=\"12\" cy=\"7\" r=\"2\" />\n          <circle cx=\"16\" cy=\"17\" r=\"2\" />\n        </symbol>\n        <symbol\n          id=\"ic-map\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16\" />\n        </symbol>\n        <symbol\n          id=\"ic-play\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"m7 4 12 8-12 8z\" fill=\"currentColor\" stroke=\"none\" />\n        </symbol>\n        <symbol\n          id=\"ic-pause\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M8 5v14m8-14v14\" stroke-width=\"4\" />\n        </symbol>\n        <symbol\n          id=\"ic-wave\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"m4 17 5-5-5-5m8 10 5-5-5-5\" stroke-width=\"2.7\" />\n        </symbol>\n        <symbol\n          id=\"ic-route\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <circle cx=\"5\" cy=\"17\" r=\"2.4\" />\n          <circle cx=\"19\" cy=\"7\" r=\"2.4\" />\n          <path d=\"M7.5 17H11l4-10h1.5\" />\n        </symbol>\n        <symbol\n          id=\"ic-edit\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path\n            d=\"m4 16 11-11 4 4L8 20l-5 1zM13 7l4 4m-2-6 2-2a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3l-2 2\"\n          />\n        </symbol>\n        <symbol\n          id=\"ic-ticket\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path\n            d=\"M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM14 6v2m0 3v2m0 3v2\"\n          />\n        </symbol>\n        <symbol\n          id=\"ic-clock\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <circle cx=\"12\" cy=\"12\" r=\"9\" />\n          <path d=\"M12 6v6l4 2\" />\n        </symbol>\n        <symbol\n          id=\"ic-stop\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <circle cx=\"12\" cy=\"12\" r=\"7\" />\n          <circle cx=\"12\" cy=\"12\" r=\"2.2\" />\n        </symbol>\n        <symbol\n          id=\"ic-close\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"m5 5 14 14m0-14L5 19\" />\n        </symbol>\n        <symbol\n          id=\"ic-calendar\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\" />\n          <path d=\"M7 3v5m10-5v5M3 11h18\" />\n        </symbol>\n        <symbol\n          id=\"ic-people\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <circle cx=\"9\" cy=\"8\" r=\"3\" />\n          <path\n            d=\"M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3c2 1 3 2 3 5\"\n          />\n        </symbol>\n        <symbol\n          id=\"ic-list\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M8 6h13M8 12h13M8 18h13M3 6h.1m-.1 6h.1m-.1 6h.1\" />\n        </symbol>\n        <symbol\n          id=\"ic-bell\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M5 16h14l-2-3V9a5 5 0 0 0-10 0v4zM10 20h4\" />\n        </symbol>\n        <symbol\n          id=\"ic-fit\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6\" />\n        </symbol>\n        <symbol\n          id=\"ic-flag\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M5 21V4c4-3 7 3 14 0v10c-8 3-10-3-14 0\" />\n        </symbol>\n        <symbol\n          id=\"ic-check\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"m4 12 5 5L20 6\" />\n        </symbol>\n        <symbol\n          id=\"ic-undo\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"m9 4-5 5 5 5M5 9h8a6 6 0 0 1 0 12\" />\n        </symbol>\n        <symbol\n          id=\"ic-install\"\n          viewBox=\"0 0 24 24\"\n          fill=\"none\"\n          stroke=\"currentColor\"\n          stroke-width=\"1.7\"\n          stroke-linecap=\"round\"\n          stroke-linejoin=\"round\"\n        >\n          <path d=\"M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8\" />\n        </symbol>\n      </defs>\n    </svg>\n    <div id=\"app\">\n      <header class=\"mast\">\n        <div class=\"brand\">\n          <span class=\"mark\"\n            ><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\">\n              <rect width=\"48\" height=\"48\" rx=\"11\" fill=\"#ecbd69\" />\n              <path\n                d=\"M6 33h14l7-12h14\"\n                fill=\"none\"\n                stroke=\"#143c3c\"\n                stroke-width=\"3\"\n              />\n              <circle\n                cx=\"11\"\n                cy=\"33\"\n                r=\"3.6\"\n                fill=\"#ecbd69\"\n                stroke=\"#143c3c\"\n                stroke-width=\"2.4\"\n              />\n              <circle\n                cx=\"36\"\n                cy=\"21\"\n                r=\"3.6\"\n                fill=\"#ecbd69\"\n                stroke=\"#143c3c\"\n                stroke-width=\"2.4\"\n              />\n              <path d=\"M9 23a8 8 0 0 1 16 0z\" fill=\"#a7412f\" />\n              <path\n                d=\"M9 26h14\"\n                stroke=\"#143c3c\"\n                stroke-width=\"1.5\"\n              /></svg></span\n          ><span\n            >DAYLINE <b>DISPATCH</b\n            ><small class=\"brand-byline\">By Noorullah Adel · 2026</small></span\n          >\n        </div>\n        <nav aria-label=\"Game options\">\n          <button id=\"help\" title=\"How to play\" aria-label=\"How to play\">\n            <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n              <use href=\"#ic-help\"></use></svg\n            ><span>How to play</span></button\n          ><button\n            id=\"audio\"\n            title=\"Sound off\"\n            aria-label=\"Sound off\"\n            aria-pressed=\"false\"\n          >\n            <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n              <use href=\"#ic-mute\"></use></svg\n            ><span>Sound off</span></button\n          ><button\n            id=\"settings\"\n            title=\"Settings and installation\"\n            aria-label=\"Settings and installation\"\n          >\n            <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n              <use href=\"#ic-gear\"></use>\n            </svg>\n          </button>\n        </nav>\n      </header>\n      <main id=\"game\">\n        <section class=\"map-card\" aria-label=\"Network map\">\n          <header class=\"map-head\">\n            <div class=\"city-title\">\n              <p>Network map</p>\n              <h1 id=\"city\">Mainbend</h1>\n            </div>\n            <div class=\"map-buttons\">\n              <span id=\"phase\" class=\"state\">Ready</span\n              ><button id=\"choose-shift\" class=\"light-btn\">\n                <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n                  <use href=\"#ic-map\"></use></svg\n                >New shift\n              </button>\n            </div>\n          </header>\n          <div\n            id=\"map\"\n            class=\"map\"\n            role=\"group\"\n            aria-label=\"Transit map. Select a station to see its passengers.\"\n          >\n            <svg\n              id=\"paper\"\n              aria-hidden=\"true\"\n              xmlns=\"http://www.w3.org/2000/svg\"\n            ></svg>\n            <svg\n              id=\"tracks\"\n              aria-hidden=\"true\"\n              xmlns=\"http://www.w3.org/2000/svg\"\n            ></svg>\n            <svg\n              id=\"vehicles\"\n              aria-hidden=\"true\"\n              xmlns=\"http://www.w3.org/2000/svg\"\n            ></svg>\n            <div id=\"stops\"></div>\n            <span class=\"north\" aria-hidden=\"true\"\n              >N<svg viewBox=\"0 0 16 19\">\n                <path\n                  d=\"M8 1 15 18 8 13 1 18z\"\n                  fill=\"none\"\n                  stroke=\"currentColor\"\n                />\n                <path d=\"M8 1v12l-7 5z\" fill=\"currentColor\" /></svg\n            ></span>\n          </div>\n          <div class=\"station-strip\">\n            <span class=\"station-dot\" aria-hidden=\"true\"></span>\n            <div>\n              <strong id=\"stop-title\">Palm House</strong\n              ><span id=\"stop-brief\"\n                >Choose a station to inspect its queue.</span\n              >\n            </div>\n            <button\n              id=\"stop-list\"\n              class=\"small-btn\"\n              aria-label=\"Open list of stations\"\n              title=\"Station list\"\n            >\n              <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n                <use href=\"#ic-list\"></use></svg\n              ><span>Stops</span>\n            </button>\n          </div>\n        </section>\n        <aside class=\"desk\" aria-label=\"Dispatch controls\">\n          <section class=\"ticket\">\n            <div class=\"ticket-top\">\n              <span id=\"mode\">Rush shift</span\n              ><svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n                <use href=\"#ic-ticket\"></use>\n              </svg>\n            </div>\n            <div class=\"time-row\">\n              <div>\n                <p id=\"time-label\">Time left</p>\n                <strong id=\"time\">03:00</strong>\n              </div>\n              <div class=\"clock-track\" aria-hidden=\"true\">\n                <span id=\"clock-fill\"></span>\n              </div>\n            </div>\n            <div class=\"ticket-stats\">\n              <div>\n                <p>Delivered</p>\n                <strong id=\"served\">0</strong>\n              </div>\n              <div>\n                <p>Score</p>\n                <strong id=\"score\">0</strong>\n              </div>\n            </div>\n          </section>\n          <section class=\"line-card\">\n            <div class=\"line-heading\">\n              <h2>Line desk</h2>\n              <span id=\"line-total\">1 / 3 active</span>\n            </div>\n            <div class=\"lines\" aria-label=\"Choose a line\">\n              <button\n                type=\"button\"\n                data-line=\"0\"\n                class=\"line-btn l0\"\n                aria-pressed=\"false\"\n              >\n                <b>A</b><span>Ember</span><small>Unassigned</small></button\n              ><button\n                type=\"button\"\n                data-line=\"1\"\n                class=\"line-btn l1\"\n                aria-pressed=\"true\"\n              >\n                <b>B</b><span>Tide</span><small>Unassigned</small></button\n              ><button\n                type=\"button\"\n                data-line=\"2\"\n                class=\"line-btn l2\"\n                aria-pressed=\"false\"\n              >\n                <b>C</b><span>Iris</span><small>Unassigned</small>\n              </button>\n            </div>\n            <div id=\"line-normal\">\n              <div class=\"route-desc\" id=\"route-desc\"></div>\n              <button id=\"edit-line\" class=\"light-btn strong-btn\">\n                <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n                  <use href=\"#ic-edit\"></use></svg\n                ><span>Draw line B</span>\n              </button>\n            </div>\n            <div id=\"line-editor\" hidden>\n              <div class=\"draft-title\" id=\"draft-title\">\n                Choose stops in order.\n              </div>\n              <div class=\"edit-actions\">\n                <button id=\"draft-clear\" class=\"small-btn\">Clear</button\n                ><button\n                  id=\"draft-undo\"\n                  class=\"small-btn\"\n                  title=\"Undo last draft stop\"\n                  aria-label=\"Undo last draft stop\"\n                >\n                  <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n                    <use href=\"#ic-undo\"></use>\n                  </svg></button\n                ><button id=\"draft-cancel\" class=\"small-btn\">Cancel</button\n                ><button id=\"draft-save\" class=\"save-btn\">Save line</button>\n              </div>\n            </div>\n          </section>\n          <button class=\"call-card\" id=\"dispatch\">\n            <span class=\"call-em\"\n              ><svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n                <use href=\"#ic-bell\"></use></svg></span\n            ><span\n              ><small>Dispatch call</small\n              ><strong id=\"call-name\">First departures</strong\n              ><span id=\"call-meta\"\n                >Connect Palm House to a working line.</span\n              ></span\n            ><span class=\"call-tally\" id=\"call-count\"></span>\n          </button>\n        </aside>\n      </main>\n      <footer class=\"foot\">\n        <div class=\"credit\">\n          Developed and designed by <b>Noorullah Adel</b> · 2026\n        </div>\n        <div class=\"operation\">\n          <button id=\"wave\" class=\"wave-btn\" disabled>\n            <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n              <use href=\"#ic-wave\"></use></svg\n            ><span>Green Wave</span><small id=\"wave-count\"></small></button\n          ><button id=\"run\" class=\"run-btn\">\n            <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n              <use href=\"#ic-play\"></use></svg\n            ><span>Start shift</span>\n          </button>\n        </div>\n      </footer>\n      <div\n        id=\"alert\"\n        class=\"alert\"\n        role=\"status\"\n        aria-live=\"polite\"\n        hidden\n      ></div>\n      <div id=\"shade\" class=\"shade\" hidden>\n        <section\n          class=\"dialog\"\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-labelledby=\"dialog-title\"\n        >\n          <header>\n            <h2 id=\"dialog-title\"></h2>\n            <button id=\"close\" aria-label=\"Close panel\">\n              <svg class=\"ico\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n                <use href=\"#ic-close\"></use>\n              </svg>\n            </button>\n          </header>\n          <div id=\"dialog-content\"></div>\n          <div id=\"install-panel\" hidden>\n            <p>\n              On iPhone, open the published game in Safari. Choose Share, then\n              Add to Home Screen. Enable Open as Web App if offered and tap Add.\n              Launch the new icon once online.\n            </p>\n            <p>\n              On other supported browsers, use the install command in the\n              browser menu. For offline trips, wait for the status below.\n            </p>\n            <p class=\"offline\">\n              <strong id=\"offline-status\">Checking offline files…</strong>\n            </p>\n            <div class=\"dialog-actions\">\n              <button id=\"native-install\" hidden>Install game</button\n              ><button id=\"retry-offline\" hidden>Retry offline setup</button\n              ><button id=\"update-button\" hidden>Update game</button>\n            </div>\n          </div>\n        </section>\n      </div>\n      <button id=\"install-button\" hidden type=\"button\">Installation</button>\n      <noscript\n        >Enable JavaScript to draw routes and run this transit game.</noscript\n      >\n    </div>\n  </body>\n</html>\n"}},
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
