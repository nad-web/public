# Dino Runner

**Small arms. Big adventures.** An original dinosaur runner designed and developed by **Noorullah Adel · 2026**.

Jump the cacti, duck under low flyers and find your rhythm across an original pixel desert. This is an independent game inspired by Chromium's offline dinosaur runner. It includes no Chromium code, sprites, sounds or Chrome-only resources.

## Play your way

- **Classic:** one heart and an endless horizon that gradually gets faster.
- **Chill:** a slower pace, three hearts and a brief recovery after a collision.
- **60s Sprint:** one heart; survive sixty active game seconds to finish.
- Three dinosaur colours, daylight or moonlight, optional synthesized chimes, local best scores, recent runs and three goals per attempt.
- Keyboard and large touch controls; responsive portrait and landscape layout.
- Installable manifest, original Home Screen icons, app-scoped offline cache and explicit update control.

No runtime dependencies, account, advertising, analytics, external fonts, API key or build step are required for this app. All game assets are local.

## Upload to nad-web/public

1. Extract `Dino_Runner.zip`.
2. Copy the **dino-runner** folder into your local repository's **applications** folder.
3. Confirm that `applications/dino-runner/index.html` exists. The files `app.json`, `sw.js`, `manifest.webmanifest`, `LICENSE`, and the `src` and `assets` folders must be alongside it.
4. In GitHub Desktop, commit the new files and click **Push origin**.
5. Wait for **Verify and deploy Pages** to finish successfully, including its publish job.

Open the game at:

**https://nad-web.github.io/public/applications/dino-runner/**

This is the website address. The GitHub repository file view is for source files. Do not put another `dino-runner` folder inside this folder, upload the ZIP itself as the game, or replace repository-root files. Your existing application-discovery workflow uses `app.json`; **no `pages.yml` edit is needed**. Other applications, including Sankey, stay separate.

An app upload cannot fix a shared Pages deployment that has failed or timed out. If the publish job is red, inspect that job before expecting the new URL to appear.

## Controls

| Action                | Keyboard                        | Phone / pointer                                    |
| --------------------- | ------------------------------- | -------------------------------------------------- |
| Jump                  | Space, Up or W; hold for height | Hold JUMP or the desert; release for a shorter hop |
| Duck / descend faster | Hold Down or S                  | Tap DUCK to toggle; jump clears this toggle        |
| Pause / resume        | P or Escape                     | Pause / resume button                              |
| Play again            | Space or R after a run          | Run again                                          |

High flyers can pass over a standing dinosaur. Low flyers need a duck. Cacti and rocks need a jump. One jump is available at a time. Focus the game canvas for held keyboard controls; normal focused buttons keep their usual keyboard behaviour.

Opening a panel, switching tabs or losing window focus pauses a running game. Resume explicitly when ready. Sprint counts active game time, so pauses do not use its sixty seconds.

One metre is ten simulated world units, with one point per metre and five points for each clean obstacle pass. Collisions do not count as clean passes. Goals reset for every attempt.

## Install and offline play

See [INSTALLATION.md](./docs/INSTALLATION.md) or the in-app **Install game** guide. Visit the deployed HTTPS page online first. Wait for **Ready for offline adventures** before relying on offline play. Browser and installed-app data can be separate, and cached files may be evicted by the operating system.

Installation availability depends on the browser and operating system. The normal web game remains usable without installation. The browser's private `chrome://dino/` address is not used by this app.

## Scores and privacy

Scores, preferences, aggregate progress and up to ten finished runs are stored only in this browser at this app's path. Partial run progress is saved periodically and on pause or exit when possible. Reload starts a fresh attempt; it does not restore an active run.

Denied or full storage leaves the game playable for the visit and displays a warning. Unreadable records are preserved until an explicit reset. Detected changes in another tab pause the game and require reload instead of silently replacing newer scores. Settings offers a JSON download of score records and a confirmed reset for this game's records only. Downloads are for keeping a copy; there is no import or cross-device synchronization feature.

Reduced-motion preferences remove optional parallax, dust, hit blinking and automatic sky cycling. Essential running obstacles still move and require visual timing. Sound starts off and is enabled only by your choice.

## Develop and update

For a local preview, serve this folder over localhost with a static HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000/`. ES modules and offline registration need HTTP(S); double-clicking `index.html` as a `file:` URL is not supported.

Optional source checks use Node.js 24 or newer, without `npm install`:

```sh
npm run cache
npm run check
npm test
```

After changing `index.html`, the manifest, licensing notices, `src/` or `assets/`, run **`npm run cache`** and commit the regenerated **sw.js**. Its version and asset-integrity list come from the runtime bytes. Re-upload the whole app folder when updating. An existing installed version offers **Update ready · Reload**; accepting it saves current progress before reloading.

The `offline: false` metadata field deliberately prevents the repository's generic cache generator from replacing this app's custom worker. The app still supports offline play through its own `sw.js`.

The icon-generation script is optional development tooling. It needs Python with Pillow; delivered icons are already generated. No Pillow package is shipped or required to run the game.

## Licensing and verification

Original code, artwork, icons, text and synthesized sounds: **MIT License · Copyright 2026 Noorullah Adel**. Preserve [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) with redistributed copies. Chromium's game is credited as inspiration; this game is not affiliated with or endorsed by Google or the Chromium project.

See [VALIDATION.md](./docs/VALIDATION.md) for verified checks and device-testing limits. Broad modern-browser support is the target; compatibility with every past or future browser is not a guarantee.
