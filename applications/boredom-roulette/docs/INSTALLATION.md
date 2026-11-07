# Boredom Roulette — install and offline guide

Designed and developed by Noorullah Adel · 2026.

## First publish

Extract the ZIP and copy the **boredom-roulette folder** into **applications** in the local `public` repository. Its entry file must be `applications/boredom-roulette/index.html`.

Commit and Push origin in GitHub Desktop. Wait for the existing **Verify and deploy Pages** workflow's **Publish website** step to finish successfully. The app address is then:

https://nad-web.github.io/public/applications/boredom-roulette/

This package does not change the shared Pages workflow. A failed or cancelled publication will leave the previous website live. Review the workflow's actual error rather than deleting or re-uploading working app folders.

## iPhone / iPad

1. Open the deployed game in Safari.
2. Tap **Share**. Depending on your Safari layout, it may be inside **More**.
3. Choose **Add to Home Screen**. If missing, scroll through actions or use **Edit Actions**.
4. Enable **Open as Web App** if it is offered, then tap **Add**.
5. Launch the new icon while connected to the internet.
6. Wait for **Ready for offline adventures** in the app's footer.
7. Close the app, enable Airplane Mode, reopen its icon and check a spin, a challenge and your saved progress.

The first online browser visit and the installed web app may use different storage contexts depending on the browser/OS. Open the installed icon online once rather than assuming an earlier Safari visit prepared it. Import a JSON backup if you want to carry browser progress into another installation context.

## Android

Open the deployed game in Chrome, Edge or another supporting browser. Choose **Install app** or **Add to Home screen** from its menu. The app displays **Install now** only after the browser supplies an actual install prompt. Open the installed app online and wait for offline readiness before testing without a connection.

## Desktop

Chrome and Edge commonly offer an install icon in the address bar or an installation entry in the browser menu. Safari on supported macOS versions offers **Add to Dock**. Availability and wording depend on browser and OS versions. Where there is no installation option, bookmark the game and use its ordinary browser page.

## Sound

Sound is off initially. Tap the music-note button or enable it in Settings. The first sound needs a user gesture because browsers restrict audio autoplay. Short chimes are generated locally; there are no recordings to preload. Turning sound off stops current notes. Muted devices or unavailable audio may remain silent. Background timer alarms are not promised.

## Offline, records and updates

- Initial preparation requires HTTPS or localhost and a connection. Opening HTML from a file manager is not supported.
- Readiness means the complete current set of core assets is cached. It does not mean device storage can never be evicted.
- If preparation fails, reconnect and use **Try again** in the footer. The game can still run online.
- When a new release is waiting, use **Update ready · Reload**. Your local record is saved independently of the app files, and active timer deadlines survive reload.
- Clearing browser/site data may remove both app files and progress. Keep a JSON backup from Settings for anything you want to retain.
- Reset in Settings affects this app's record at its current path. It does not clear unrelated app records or caches.

## Verification limit

The source includes automated engine/storage/service-worker tests and browser layout/interaction checks. A simulated viewport is not a physical iPhone. Real Safari/iPhone, Firefox, Edge and HTTPS Home Screen/offline installation should still be checked on the devices you intend to support. No static PWA can guarantee identical installation menus or permanent offline storage across every browser.
