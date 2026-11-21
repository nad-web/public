# Arc & Ink
---
[arc-and-ink](https://nad-web.github.io/public/applications/arc-and-ink/)
---

An independent geometric construction game developed and designed by **Noorullah Adel · 2026**. A compass fixes distances, a straightedge joins exact points, and each crossing becomes material for the next move.


## How to play

Choose **Straightedge** and two distinct points to draw an infinite line through them. With **Compass**, select the center first and then a point on the rim. Crossing points are computed directly from the curves. **Pin** marks an existing point when a puzzle asks for one.

Start with *The meeting line*. Choose the straightedge and tap the two hollow dots where the two circles cross. A short proof explains the result. Try either apex when you reach the equilateral triangle puzzle.

The 16 experiments span four chapters. Every experiment is available from **Atlas**. Solving one adds an illustrated geometric seal to your atlas. A move target is a reference solution length. Other valid constructions count. Hints reveal one clue at a time. A fresh attempt can improve the best move count or earn an unaided record.

- **Daily** selects a puzzle and changes its orientation, position and size for the UTC date. Open Daily again to start a new day’s edition.
- **Free lab** lets you plant arbitrary points as well as draw and pin. The **Points** panel accepts numerical coordinates in this mode.
- **Notebook** lists your operations. Use **Replay my construction** to step through them, or **Save drawing as SVG** to export the visible drawing.
- Drag the paper to pan, use the zoom controls for close intersections and use the crosshair to fit the original arrangement. **Points** lists every constructed point by label, including off-board points. Moves are limited to 60 per drawing.
- The settings button (**•••**) contains the sound toggle, point labels, rules, installation and restart. Sound starts off. The four-corners button enters focus view.

## iPhone and offline play

Open the deployed HTTPS address in Safari. Use **Share → Add to Home Screen**, enable **Open as Web App** when offered and tap **Add**. Launch the new icon to play in its own window. The normal browser tab can retain its address bar. On compatible desktop or Android browsers use the install option in the browser menu.

Open the game once online. Under **Settings → How to play and install**, wait for **Offline copy ready on this device** before disconnecting. Offline access depends on the browser retaining the app cache. The worker caches only this app’s runtime files under its own scope. Reopen the game online after an update and close older open game tabs to activate a waiting version.

Installation reference: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

## Access and progress

Press **L** for straightedge, **C** for compass, **P** for pin and **N** for the point picker. Tab and Enter operate the controls. **Z** undoes, **Y** redoes and **Escape** closes a panel or clears a selection. With the board focused, arrow keys pan. In replay, left and right step backward and forward.

Each atlas drawing and the current daily drawing resume in the same browser profile. Best scores and options use local browser storage. Browser restrictions or clearing site data can remove saved progress. No information is transmitted to a score service.

## Development

Open `index.html` directly for basic play, or serve the folder over localhost to exercise the worker and manifest. With Node 20 or newer, run `npm test` in this folder. The tests exercise complete solution paths, daily transformations, invalid moves, intersections and replay. The geometry engine rejects approximate construction data independently of tap tolerance.

After changing runtime assets, update the cache version in `sw.js` and include any new runtime files in its asset list. This app supplies its own scoped worker. The catalogue metadata leaves generic repository worker generation disabled.

## License

MIT © 2026 Noorullah Adel. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
