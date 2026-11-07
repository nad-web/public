# Boredom Roulette — validation

Release 1.0.0 · Noorullah Adel · 2026.

## Automated checks

Run `node scripts/check.mjs` for browser-module syntax, relative local references, author branding, manifest scope/icon paths and exact correspondence between the compiled worker and current core bytes.

Run `node --test tests/*.test.mjs` for:

- Original catalogue counts and valid content; filter combinations; two-minute gentle coverage; category-first selection; no repeats before deck exhaustion; single-card cycles; exact wheel landing angles.
- Explicit and idempotent completion, bounded timer deadlines, pause/resume/reload, no automatic completion on timeout, one daily-trio bonus, local midnight/streak handling and bounded journal records.
- Backup schema validation, custom challenge limits, rejected malformed records, app-key isolation, stale-tab conflicts, denied/quota storage and unreadable-record preservation.
- Escaped downloadable SVG cards, long-text wrapping, author credit, sound opt-in/mute and silent fallback.
- Generated service-worker bytes, complete offline entry/module responses in a simulated worker/cache/network environment, cache isolation, failed-precache cleanup, missing-file repair, intentional activation and portability to another repository prefix.

The repository integration checks run its required source checks, test discovery and complete build with this app added to `applications/boredom-roulette/`. The protected Sankey source fixture remains unchanged. Only the new app folder is included in the deliverable ZIP.

## Recorded results

- 31 app tests passed, including six generated-worker/cache/network tests and two audio opt-in/mute tests.
- The repository integration passed all 207 discovered tests and built 25 applications, including the protected Sankey fixture.
- The source check verified 17 integrity-checked app-local offline assets.

## Browser checks

The final delivery is checked in the available Chromium browser at the app's nested repository path. Observed flows include filtered spinning, disabled spin/reset recovery with no matching cards, solo/together settings, starting/pausing/restoring a timer after reload, explicit completion, favorites, custom idea creation, library search/direct selection, daily-trio bonus, light/dark appearance, sound toggle, manual sharing/copy fallback, and installation instructions.

Desktop content width matched its 1348 px viewport. A 320 px phone frame had a 305 px content viewport with no horizontal overflow; its installation dialog was 282 px wide and scrolled within the frame. A 780 × 390 landscape frame had a 765 px content viewport with no horizontal overflow; its 620 × 354 installation dialog remained scrollable. These are frame tests, not claims of native iPhone testing.

A delayed clipboard response initially interrupted the idea library. Sharing now opens an immediate text panel, automatic copy has a bounded wait, and late responses only update a still-open panel. The regression flow (copy, close, open pocket, search) passed without a replacement dialog.

SVG and backup download links produced local Blob URLs. The cloud browser's download-event capture did not return completed files, so actual saved-file completion remains a manual browser/device check. SVG/text generation, escaping and wrapping passed automated tests. The test backup upload was blocked because upload permission was declined; no alternative upload route was attempted. End-to-end file-picker import remains pending, while backup schema validation and record round-trip tests passed.

## Pending device checks and limits

- Physical iPhone/iPad Safari, macOS Safari, Firefox and Edge are not available as separate device engines in this environment. A narrow Chromium frame does not substitute for those tests.
- The local preview route may not provide a secure context, so real browser worker registration, native install prompts, installed-app lifecycle and Airplane Mode must also be tested after successful HTTPS publication. Automated worker tests simulate the cache/network lifecycle rather than claiming a real device installation.
- Browser storage can be denied, cleared or evicted. The app reports unsuccessful writes; current-visit state can be exported. Stale-tab checks handle detected conflicts but do not make localStorage transactional.
- Timer deadlines survive backgrounding/reload, but background chimes are not guaranteed. Clock or time-zone changes can affect local-day rewards. Completing a challenge is a user action, not a measured activity claim.
- GitHub Pages publication must succeed separately. This app cannot fix an account/service-side deployment timeout or cancelled workflow.
