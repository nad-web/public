# Boredom Roulette

**A small spin. A better story.** Designed and developed by **Noorullah Adel · 2026**.

A complete, standalone static browser game with 120 original mini adventures. Choose your time, energy, location and company; spin a six-category wheel; and give a tiny idea a go. It needs no account, server API, runtime package installation or external CDN.

## Upload with GitHub Desktop

1. Extract `Boredom_Roulette.zip`.
2. Put the entire extracted **`boredom-roulette` folder** inside your local repository's **`applications` folder**.
3. Confirm the path is `applications/boredom-roulette/index.html`. Avoid an extra nested `boredom-roulette/boredom-roulette` folder.
4. In GitHub Desktop, review the new files, commit them and click **Push origin**. If GitHub Desktop asks you to pull recent README changes first, fetch/pull before pushing.
5. The existing repository workflow discovers the app, runs its checks/tests, builds it and adds the catalogue links. **No per-app change to `pages.yml` is required.**
6. Wait for **Publish application library → Publish website** to finish successfully.

After successful deployment:

**https://nad-web.github.io/public/applications/boredom-roulette/**

The GitHub source folder and the live game address are different pages. Pushing source is only the first step; the Pages deployment must succeed before the new game address is available. A `syncing_files` deployment timeout is not fixed by moving this app, renaming its entry file, or extending the action beyond GitHub's ten-minute limit. Check the actual deployment logs and GitHub Pages support if that issue persists.

## What is included

- Six categories with 20 original ideas each: Create, Move, Explore, Reset, Learn and Connect.
- 2-, 5- and 15-minute timeboxes, solo/together modes, gentle/active energy and flexible/inside/outside filters.
- Fair selection among categories with unseen matching cards, followed by a card within the chosen category. Matching cards do not repeat until their deck is exhausted. The next cycle avoids the immediately previous card when alternatives exist.
- An animated SVG wheel whose final segment matches the selected challenge; a quick, still result when reduced motion is requested.
- Optional timers with pause/resume, persisted clock deadlines, step checkmarks and explicit completion. Background timers are not guaranteed to play a sound.
- Sparks, daily trios, consecutive-day streaks, four milestones and a recent-adventure journal. Completing a 2/5/15-minute card grants 10/20/35 sparks; the third completion in a local calendar day adds 30 once.
- Favorites, search, direct card selection, and up to 40 validated custom ideas. Direct selection from the pocket uses that card regardless of wheel filters; read its context tags.
- Original, synthesized chimes, **off by default**, with a sound toggle. No music or audio files need downloading.
- Light/dark appearance, touch and keyboard controls, visible focus, labeled controls, scrollable dialogs and a reduced-motion layout.
- Share/copy challenge text and download an original, branded SVG idea card.
- App-scoped local records, JSON backup export/import, explicit reset confirmation and stale-tab conflict detection.
- A relative web app manifest, original Apple/maskable PNG icons and an app-scoped integrity-checked offline service worker.

There are no wagers, cash-value rewards, purchases, analytics, remote AI or logins. Scores are self-reported for fun; this is not an anti-cheat system. Adapt the prompts to your comfort and company. Group members can always pass.

## Install and play offline

Use the in-app **Install app** guide, or read [INSTALLATION.md](docs/INSTALLATION.md).

On iPhone, use Safari → Share → Add to Home Screen, and enable Open as Web App if offered. Open the installed icon online until the app reports **Ready for offline adventures**, then test with Airplane Mode. Browser installation menus vary; normal web play remains available when installation is unsupported.

Offline preparation needs a successful HTTPS deployment (or localhost for development). Browser storage can be cleared, denied or evicted. The readiness indicator checks the app's cached core files; it is not a permanent storage guarantee.

## Saved records and privacy

Only this browser's local storage is used. The key is `noorullah:boredom-roulette:v1:<app-path>`; the path suffix keeps copies in different repository paths separate. The record contains settings, favorites, custom text, seen cards, the active challenge, aggregate progress, up to 40 recent completions and up to 370 daily counts. There is no cross-device sync.

Settings → **Download backup** produces a JSON file. **Import backup** validates the app identity, schema, fields, sizes and limits before a confirmed replacement. Do not import untrusted text as your own work; custom text is displayed as text, not executable markup. An unreadable existing record is preserved until an explicit reset or import. If saving is unavailable, current-visit play continues with a visible warning and a backup option.

Use one tab at a time when editing records. Writes compare the latest stored value before saving, and detected conflicts load the newer record rather than silently replacing it. Local storage is not a transactional database; simultaneous cross-tab writes cannot be guaranteed atomic.

The optional timer uses `Date.now()` deadlines. It keeps counting while away, resumes after reload, and caps backward clock jumps to its stored remaining duration. It never marks a challenge completed automatically. Streaks and bonuses use local calendar dates, not UTC or a server clock. A restored backup follows those same rules; clock or time-zone changes may affect the displayed day.

## Folder and development

All runtime files stay in this folder. `index.html`, `src/`, `assets/`, `manifest.webmanifest`, `sw.js`, `LICENSE` and `THIRD_PARTY_NOTICES.md` are ready to serve directly. The accompanying scripts, tests and documentation are for maintenance. A modern static server supplies ES module MIME types; opening the HTML directly with `file://` is not a supported launch method.

Node 24 development checks (no npm install needed inside this app):

```sh
node scripts/check.mjs
node --test tests/*.test.mjs
```

After editing runtime files, icons, license or notices, regenerate the offline worker **before** the checks:

```sh
node scripts/update-cache.mjs
```

`app.json` deliberately uses `offline: false` to opt out of the repository's generic offline-worker compilation. **The game itself supports offline play through its own compiled worker.** Do not replace it with the repository's generic worker. Its cache prefix includes this app's full scope, and activation removes only older caches under that exact prefix. Runtime changes create a new content revision; users choose **Update ready · Reload** to activate a waiting update. Readiness checks all core files, and Try again can repair missing files online.

`scripts/make-icons.py` is an optional icon-regeneration helper requiring development-only Pillow. Generated icons are included, so end users do not need Python or Pillow. Keep package/app/manifest metadata and the cache compiler version aligned when releasing a future version.

See [VALIDATION.md](docs/VALIDATION.md) for checks and limitations and [IMPLEMENTATION_NOTES.md](docs/IMPLEMENTATION_NOTES.md) for source references.

## License and credits

Original application code, challenge text, graphics, icons, share-card artwork and synthesized chimes are licensed under the [MIT License](LICENSE), copyright **2026 Noorullah Adel**. Original offline/audio foundations are adapted from the same developer's MIT-licensed Rooftop Cat project. Preserve the permission text and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) when redistributing. User-created text retains its author's rights. No third-party runtime library, font, photograph or recording is bundled.
