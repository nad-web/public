# Rooftop Cat

**Designed & developed by Noorullah Adel · 2026.**

A complete, standalone rooftop runner. Small paws. Big adventures.

After deployment: **https://nad-web.github.io/public/applications/rooftop-cat/**

## Play

Tap the game, use the large **Jump** button, or press **Space**, **↑** or **W**. Tap or press again in the air for a second jump. Clear gaps and chimneys; three lost hearts finish a run. After a tumble, the cat returns to its last rooftop with brief protection from chimneys.

| Mode          | Adventure                                                                      |
| ------------- | ------------------------------------------------------------------------------ |
| Cozy stroll   | Slower travel, narrower gaps and fewer chimneys.                               |
| Rooftop chase | Faster travel, wider gaps and more chimneys.                                   |
| Daily route   | Repeatable 1,000 m route keyed to the local calendar date; unlimited attempts. |

Regular fish start at 25 points, golden fish at 75. Catches less than 2.6 seconds apart build a multiplier up to ×5. Each meter adds one point. The three little missions reset on each run. Personal bests and lifetime totals stay on this browser/device.

Press **P**, **Escape** or Pause to pause; use **Keep exploring** to resume. Leaving the tab or opening help/settings also pauses. Scores are saved every five seconds of play and when paused or left. A force-quit before the next snapshot may lose recent progress. A closed run does not resume after a fresh launch.

Fish chimes begin **off**. The speaker button enables them and plays a sample. Sounds are synthesized locally and work offline. Settings offer golden-hour/moonlight skies and Ginger/Midnight/Cloud cats. Extra effects can be disabled; system reduced-motion settings take priority.

## Upload this app with GitHub Desktop

1. Extract the ZIP. It contains one folder, **rooftop-cat**.
2. Select your existing **public** repository and **main** branch in GitHub Desktop. Fetch/pull first.
3. Choose **Repository → Show in Finder**, then open **applications**.
4. Copy the extracted **rooftop-cat** folder into **applications**. The entry must be **applications/rooftop-cat/index.html**.
5. Commit and **Push origin**. Your existing shared workflow discovers, checks and publishes this new static app and updates the library links. **No pages.yml edit is needed.**
6. After deployment succeeds, open the published address above.

All package contents belong inside **applications/rooftop-cat/**. Avoid a second nested rooftop-cat folder. Upload the extracted files, not the ZIP itself. No repository-root replacement, npm installation on your Mac, or change to Sankey is required.

For a browser-only upload, open applications on GitHub and upload the extracted rooftop-cat folder while preserving every relative path. The package contains fewer than 100 files and no large media files.

## Install and play offline

Use the in-game **Install game** guide or [the full instructions](docs/INSTALLATION.md). On iPhone: open the game in Safari → **Share → Add to Home Screen**, leave **Open as Web App** enabled if offered, then **Add**. Open the new cat icon online once and wait for **Ready for offline adventures**. Close, enable Airplane Mode and reopen to verify your own device.

Installation is optional and its UI varies by platform. The same game runs in a normal browser tab. Offline play requires HTTPS or localhost and a completed first cache. Files can be evicted by the browser; return online and use **Try again** if necessary. Installed apps and browser tabs may store records separately.

Updates are offered explicitly. **Update game** saves the score snapshot, pauses the run and reloads the new release. This game's cache namespace includes its exact origin and folder; it does not clear another app's cache.

## Standalone design and local records

No account, backend, API key, CDN, external game engine, image pack, downloadable font or recording is required. Every runtime asset is inside this folder. Relative URLs allow another repository prefix. Direct file:// opening is not the supported JavaScript module/PWA installation workflow.

The app.json **offline: false** setting disables the repository's generic offline compiler because Rooftop Cat ships its **own compiled offline worker**. It does not disable this game's offline play. Keep that field unchanged unless intentionally migrating the worker architecture.

Records use **noorullah:rooftop-cat:v1**, validated versioned JSON, bounded daily bests and bounded run snapshots. Resaving a partial run adds only newly collected fish/distance and does not count the run twice. Denied/full storage falls back to this visit's records with a visible notice. Use one tab per run. There is no synchronization or online leaderboard.

**Export score records** downloads a readable JSON archive; it is not an import/restore feature. Reset needs an explicit checkbox and affects this game's key only. See [validation and limits](docs/VALIDATION.md).

## Optional maintainer commands

With Node 24 or later, from this folder:

```sh
node scripts/check.mjs
node --test tests/*.test.mjs
```

After editing runtime files, regenerate and upload the checked-in worker with the changed files:

```sh
node scripts/update-cache.mjs
node scripts/check.mjs
node --test tests/*.test.mjs
```

The release revision and request integrity values derive from actual runtime bytes. Incomplete or mixed uploads fail offline integrity checks until a matching complete release is present. Docs/tests are not precached. The optional icon generator uses Python/Pillow; no maintainer dependency is needed to play or upload the ready files.

Local preview: run `python3 -m http.server 8080` inside this folder, open http://localhost:8080/, then stop with Control+C. Also test the real nested HTTPS URL before release.

## Rights

Original code, game content, art, icons and synthesized chimes: **MIT License**, copyright **Noorullah Adel, 2026**. Retain the copyright and permission notice on redistribution. [Full license](LICENSE) · [Rights and provenance](THIRD_PARTY_NOTICES.md) · [Platform research](docs/RESEARCH.md).
