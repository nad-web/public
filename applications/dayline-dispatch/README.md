# Dayline Dispatch

A pocket transit game developed and designed by **Noorullah Adel · 2026**.

[Play Dayline Dispatch on GitHub Pages](https://nad-web.github.io/public/applications/dayline-dispatch/)

## Your first route

1. Choose **Start shift**. The red Ember train already serves three stations.
2. Select **B**, then **Draw line B**. In Mainbend, tap **Palm House**, then **Central**, and select **Save line**. A blue train enters service. Central now allows transfers.
3. Select a station to read its queue. When another station opens, extend a route or bring Line C into service. You can tap stations, drag across them, or select them from **Stops**.
4. A starred station has a dispatch call. Deliver three passengers there within 44 seconds to earn 50 points and add a seat to each train, up to eight. **Green Wave** speeds up every train for eight seconds, with 30 seconds between activations.

Trains shuttle automatically. Routes serve two to five stops each. Editing and opening panels pause the simulation. Stations with six or more waiting passengers have a red badge. Clearing an existing route and saving suspends that line. A train already travelling finishes its segment and safely unloads riders.

## Shifts and tickets

- **Rush shift** lasts three minutes. Four stations grow into eight across the map. Pick Mainbend, Kite Bay or Cinder Vale.
- **Daily shift** gives everyone the same city and seeded demand schedule for the UTC date. Compare personal bests or replay the same timetable.
- **Sunday service** is untimed, with lighter demand and patient riders. Open **Settings → Finish this shift** to stamp a ticket whenever you like.

Each delivered rider earns 10 points, plus 4 if they changed trains. Timed-shift riders leave after about 62 seconds of accumulated platform waiting. Bronze starts at 220 points, Silver at 480 and Gold at 800. The ticket distinguishes people who walked away from those still travelling at closing time.

Your active shift, sound preference and best tickets are saved in this browser. Changing tabs pauses the game. Reopening a saved shift starts paused. Sound is off initially. The game includes reduced-motion support, station names and line letters, visible keyboard focus and an alternative station list. Use **1–3** for line selection, **E** to edit, **G** for Green Wave, **Space** to start or pause when the board has focus, and **Escape** to close or cancel.

## Install on iPhone and play offline

1. Open the published game in Safari while online.
2. In Safari’s sharing menu, select **Add to Home Screen**, turn on **Open as Web App** if shown, then tap **Add**.
3. Launch the new Dayline icon **once while online**. In the game, open **Settings → Install & play offline**. Wait for **Ready for offline play** before taking the game offline. You can use **Retry offline setup** to restore missing files while connected.

Other browsers can play directly from the URL. Where installation is supported, use the browser’s install command or the in-game install option. The game fits the available screen in portrait and landscape. The browser controls availability of native full screen and installation.

[Apple’s iPhone Home Screen guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)

## Publish with GitHub Desktop

1. Unzip the download. Copy the single **dayline-dispatch** folder into the **applications** folder of your local **public** repository.
2. Check that the path is **applications/dayline-dispatch/index.html**. The worker, manifest, source, font, icons, tests and notices all belong in the same app folder.
3. In GitHub Desktop, commit to **main** and select **Push origin**. The repository discovers this app through its local **app.json** in the **fun** category. Its existing Pages workflow builds the site and refreshes the application links.
4. After **Verify and deploy Pages** succeeds, open the game link above or the [application library](https://nad-web.github.io/public/applications/).

## Local development

The game runs directly on a static HTTP server. From this folder, run `python3 -m http.server 8000` and open `http://localhost:8000/`. For changes to runtime files, regenerate the worker with `npm run cache`; run `npm run check` and `npm test` with Node 24. HTTPS or localhost enables the offline worker. All gameplay assets are local.

## License

[MIT License · Noorullah Adel](./LICENSE) · [Third-party credits](./THIRD_PARTY_NOTICES.md) · [Barlow Condensed font license](./assets/type/OFL.txt)
