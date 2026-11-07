# Implementation notes and primary references

This is an original, buildless HTML/CSS/ES-module application. Browser compatibility choices were checked against the following primary documentation on 7 November 2026. Documentation is referenced, not copied or bundled.

- Apple: [Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios). The guide uses Share → Add to Home Screen and Open as Web App where offered. The app therefore supplies manual iPhone instructions instead of promising a browser install prompt.
- MDN: [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [registration scope](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/scope). Registration and manifest URLs stay relative to this folder, under HTTPS or localhost; each cache prefix includes its exact app scope.
- MDN: [Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) and [autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay). Audio is off by default and created/resumed from a user action. The app continues silently if audio is unavailable.
- GitHub: [Custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). The user's existing root build discovers this folder and publishes its output with the rest of the library. This app does not register a second deployment workflow.
- GitHub: [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). A service-side `syncing_files` timeout is distinct from source upload or game execution. The package does not promise to resolve that hosting failure.

## Architecture

- `src/engine.js`: pure filtering, category-first selection, no-repeat deck, wheel landing angles, timer state, local calendar progress, validation and milestones.
- `src/challenges.js`: 120 original, self-contained English challenge cards; no network content dependency.
- `src/storage.js`: app/path-scoped records, unreadable-record guard and pre-write stale-tab comparison.
- `src/share.js`: plain-text sharing and escaped, original SVG card exports.
- `src/app.js`: semantic DOM rendering, dialogs, keyboard/touch controls, user actions and backup handling. User text is assigned with `textContent` or form values rather than executable HTML.
- `src/audio.js`: original short Web Audio oscillator patterns, mute and silent fallback.
- `src/pwa.js`: scoped registration, real install-prompt handling, core-file readiness/repair and intentional updates.
- `scripts/cache-template.js` / `update-cache.mjs`: complete local core inventory, per-file SHA-256 request integrity and content-based revisions. Generated `sw.js` ships ready to use.

The game supplies prompts and records voluntary completions. It does not evaluate whether an activity was actually performed. Sparks and milestones carry no monetary value. Physical prompts include alternatives and are intended to be adapted or skipped, rather than prescribing exercise or medical outcomes.
