# Licensing, authorship and acknowledgements

## Dino Runner — original work

**Designed and developed by Noorullah Adel · 2026.**

Original game engine, controller, renderer, interface, pixel dinosaur and flyer patterns, desert artwork, icons, documentation and synthesized chimes are provided under the included **MIT License**, copyright 2026 Noorullah Adel. See `LICENSE` for the full permission notice and warranty disclaimer. Preserve that notice when distributing copies or substantial portions.

The app-scoped offline worker, cache compiler, validated-storage foundation and associated source checks/tests adapt original MIT-licensed modules from Noorullah Adel's Rooftop Cat and Boredom Roulette projects. Their original author and license are retained here. These are shared foundations by the same author, not Chromium modules.

## Inspiration: Chromium's offline dinosaur game

The familiar concept of a dinosaur jumping obstacles is inspired by Chromium's offline game, commonly reached in Google Chrome at `chrome://dino/`.

- Official source tree: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/components/neterror/resources/dino_game/
- Official Chromium license: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/LICENSE

The referenced Chromium source carries a BSD-style license, including copyright/notice retention, binary-distribution notice and non-endorsement conditions. **This package does not redistribute Chromium source, its sprite sheet, sound assets, internal resources or Google/Chrome logos.** Its implementation and artwork are independent, so Chromium code is not being relicensed as MIT here. If you later add upstream code or assets, inspect the applicable file notices and include all required licenses for those additions.

Chrome and Google are names of their respective owners. Their mention identifies the inspiration only. Dino Runner is not affiliated with, sponsored by or endorsed by Google or the Chromium project.

## Runtime dependencies

No third-party JavaScript package, font, image, recording, remote script or CDN dependency is bundled. Canvas, Web Audio, Web App Manifest, Service Worker and other browser APIs are platform features. Chimes are generated locally with oscillators; there are no sampled recordings or music tracks.

## Optional development tooling

`scripts/make-icons.py` uses **Pillow** to turn the original pixel artwork into PNG icons. Pillow is development-only, is not included in the ZIP and is unnecessary for playing or deploying the supplied files. Pillow is distributed under its **MIT-CMU License**; see https://github.com/python-pillow/Pillow/blob/main/LICENSE for the current notice and any bundled-component terms if you install or redistribute that tooling. Dino Runner's generated original icons are covered by this package's MIT License.

The delivered app and Node checks use standard platform libraries. Python, Node.js, browser implementations and GitHub hosting are not distributed by this package and retain their own terms.
