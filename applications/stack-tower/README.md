# Stack Tower

**Designed and developed by Noorullah Adel · 2026.** Original, MIT-licensed tiny arcade game with a dedicated screen-filling play view, optional synthesized audio, local records and app-scoped offline support.

## Upload

Extract the ZIP and copy **stack-tower** into your local repository's **applications** folder. The path must be `applications/stack-tower/index.html`. Keep this app's src, assets, manifest.webmanifest, sw.js, app.json and license files alongside it. Commit and Push origin in GitHub Desktop. Your existing discovery-based Pages workflow handles the app; **no pages.yml edit is needed**. Keep all other apps as they are.

After a successful build AND publish, open:

https://nad-web.github.io/public/applications/stack-tower/

## iPhone screen-filling play

Play switches to its own viewport-sized screen, with safe-area padding and a portrait/landscape layout. Native fullscreen is requested from the Play gesture where supported and can be retried with the Fullscreen button. A normal iPhone browser tab can retain browser controls. For app-style iPhone play, open in Safari → Share (or Page Menu → Share) → Add to Home Screen → Open as Web App when offered → Add, then **launch the installed icon**.

The manifest requests fullscreen, with standalone fallback. iOS controls system status/gesture regions; the game cannot promise to hide every OS interface on every version. The page uses dynamic viewport sizing, so gameplay fits the available space. No native App Store package is needed. See docs/INSTALLATION.md and the in-app Install guide.

## Rules

Tap DROP BLOCK or the canvas, or press Space/Enter when the game canvas is focused. Overhang is trimmed away; a complete miss or overlap under one world unit ends the run. Each placed block earns 10 points. Perfect alignment adds 5, plus 10 for every third consecutive perfect drop. Classic speeds up; Chill is slower and allows a wider perfect tolerance. Best heights are separate by mode. P or Escape pauses. Moving blocks require visual timing.

Opening panels, leaving a tab or exiting native fullscreen pauses a running game. Resume explicitly. Reload starts a fresh game. Progress saved at game checkpoints contributes to best records but does not restore an active board or tower. Data stays at this browser/app path, not an account. Denied storage leaves current-visit play available; unreadable data is preserved until explicit reset. Detected stale-tab changes block further play/writes until reload. Reset is confirmed and affects only this app's records. Use one tab per game.

## Offline, development and licensing

First open the deployed HTTPS address online and wait for **Ready for offline play**. Open a newly installed icon online once too. Cache eviction or clearing website data can remove offline files and scores. Updates are explicit via **Update ready · Reload**. Browser installation availability differs; the normal web page also works.

No npm install, runtime library or build step is required for this app. For a development preview, serve it over localhost, for example `python3 -m http.server 8000`. Double-clicking file: URLs does not support ES module/service-worker loading.

Optional checks use Node.js 24+: `npm run cache`, `npm run check`, `npm test`. After changing runtime files, regenerate sw.js with `npm run cache` and upload the complete app folder. The metadata `offline: false` prevents the repository from replacing the custom worker; offline support is supplied by this app's own worker. The worker controls only its own scope and cache prefix.

Optional icon regeneration needs Python with Pillow; icons are already supplied. See LICENSE, THIRD_PARTY_NOTICES.md and docs/VALIDATION.md. Physical-device installation, offline and audio checks remain important after deployment; compatibility with every past or future browser is not guaranteed.
