# Noorullah’s Build Lab

Developed and designed by **Noorullah Adel · 2026**.

[Open the application library](https://nad-web.github.io/public/applications/).

Every app is a complete static browser application in `applications/<slug>/`. The build discovers app folders, creates the catalogue and publishes one GitHub Pages artifact. The protected Sankey Studio source is unchanged.
<!--
Read [the upload guide](docs/MIGRATION.md), [the future-app guide](docs/ADD_APP.md), [the audit](docs/AUDIT.md) and [current validation](docs/VALIDATION.md).

For a future app, add `applications/my-app/index.html` plus that app's own browser-ready files. Commit to main. The existing workflow publishes it at `https://nad-web.github.io/public/applications/my-app/` and adds the library/README links. No per-app workflow edit is needed.
-->
<!-- APP_CATALOG_START -->
| Application | Category | Purpose |
| --- | --- | --- |
| [Artikel Trainer](https://nad-web.github.io/public/applications/artikel-trainer/) | languages | Make der, die, and das a little less mysterious. |
| [Break Buddy](https://nad-web.github.io/public/applications/break-buddy/) | health-wellbeing | A gentle reminder to step away from the screen. |
| [Decision Wheel](https://nad-web.github.io/public/applications/decision-wheel/) | fun | Too many options? Give a small decision a playful spin. |
| [Deutsch Daily](https://nad-web.github.io/public/applications/deutsch-daily/) | languages | Build a German vocabulary habit, one useful word at a time. |
| [Flashcard Studio](https://nad-web.github.io/public/applications/flashcard-studio/) | education | Make a small deck, then practice what matters. |
| [Focus Flow](https://nad-web.github.io/public/applications/focus-flow/) | productivity | A simple focus timer with room to breathe between sessions. |
| [Habit Garden](https://nad-web.github.io/public/applications/habit-garden/) | health-wellbeing | Track a few everyday habits without turning life into a score. |
| [JSON Workbench](https://nad-web.github.io/public/applications/json-workbench/) | developer-tools | Format and inspect JSON without sending it to a server. |
| [Math in Motion](https://nad-web.github.io/public/applications/math-in-motion/) | education | 150 bilingual lessons, interactive diagrams and 600 narrated videos. |
| [Memory Garden · باغ حافظه](https://nad-web.github.io/public/applications/memory-game/) | fun | A Dari/Farsi matching garden with ten levels and local narration. |
| [Memory Lab](https://nad-web.github.io/public/applications/memory-lab/) | fun | A tiny matching game for a quick mental reset. |
| [Pack Light](https://nad-web.github.io/public/applications/pack-light/) | on-the-way | A reusable packing list for less last-minute travel chaos. |
| [Palette Studio](https://nad-web.github.io/public/applications/palette-studio/) | creative | Find a handful of colors that work well together. |
| [Pocket Budget](https://nad-web.github.io/public/applications/pocket-budget/) | finances | A calm, clear picture of where your monthly money goes. |
| [QR Studio](https://nad-web.github.io/public/applications/qr-studio/) | everyday-tools | Make simple QR codes with an uncluttered preview. |
| [Quiz Forge](https://nad-web.github.io/public/applications/quiz-forge/) | education | Turn a small question set into a focused practice round. |
| [Regex Playground](https://nad-web.github.io/public/applications/regex-playground/) | developer-tools | Explore a pattern against sample text with clear feedback. |
| [Sankey Studio](https://nad-web.github.io/public/applications/sankey-diagram/) | visualisation | Open this independent browser application. |
| [Savings Goal](https://nad-web.github.io/public/applications/savings-goal/) | finances | Turn a savings target into a clear, editable plan. |
| [Trip Split](https://nad-web.github.io/public/applications/trip-split/) | on-the-way | Keep shared trip costs understandable from the first coffee. |
| [Unit Converter](https://nad-web.github.io/public/applications/unit-converter/) | everyday-tools | Everyday conversions with the units always in view. |
| [Week Board](https://nad-web.github.io/public/applications/week-board/) | productivity | A small, flexible board for the week ahead. |
| [Writing Sparks](https://nad-web.github.io/public/applications/writing-sparks/) | creative | A small nudge for the blank page. |
<!-- APP_CATALOG_END -->

Node 24 development: `npm ci --ignore-scripts`, `npm run check`, `npm test`, `npm run build`, `npm run preview`. Or use `npm run dev` to build and serve.

Original code/content: [MIT](LICENSE). Third-party rights remain covered by [their notices](THIRD_PARTY_NOTICES.md) and local app licenses.
