# Install Dino Runner

Designed and developed by **Noorullah Adel · 2026**.

Start with the deployed address:

https://nad-web.github.io/public/applications/dino-runner/

## iPhone and iPad

1. Open the address in **Safari** while online.
2. Tap **Share**, then **Add to Home Screen**. Depending on your iOS version, check **More** or **Edit Actions** for that item.
3. If offered, turn on **Open as Web App**, then tap **Add**.
4. Open the new Dino Runner icon while online. Wait until the footer says **Ready for offline adventures**.
5. Close the game, enable Airplane Mode, and reopen the icon to check offline play on your device.

Turn Airplane Mode off afterwards to receive updates. Safari tabs and the installed web app may use separate saved data. Open each online before using it offline.

Apple's guide: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

## Android and desktop

Use the browser's **Install app** or **Add to Home screen** menu when available. A compatible browser may also expose an **Install now** button in the game. It only appears after the browser supplies an actual install prompt. Safari on supported Macs can offer **Add to Dock**.

Some browsers provide only a shortcut or do not offer installation. You can play from the ordinary browser address. Installation and offline support vary across browsers and operating systems.

## Offline readiness and updates

- The first visit, cache repair and updates need an internet connection and HTTPS (localhost also works for development).
- **Ready for offline adventures** means all required game assets are present in the app's current cache when checked. It does not guarantee permanent storage: browsers can evict it, and clearing website data removes local files and scores.
- If preparation is incomplete, reconnect and use **Try again** or **Install game → Check offline setup**.
- **Update ready · Reload** offers a waiting version explicitly. Accepting pauses the run and saves its progress before reload. Reload starts a new attempt.
- The worker controls only its own folder and only removes old caches with this exact app scope. It does not control or delete Sankey or another application's files.

## Sound and touch

Sound is off initially. Tap the sound button to enable short original chimes. Browsers require a user gesture before audio can start. Silent mode, device volume, backgrounding or browser policy may prevent sound; silent gameplay still works.

Use JUMP for hops and DUCK for a latched crouch on a phone. A jump clears that crouch. Essential runner motion needs visual timing. The app uses large controls, safe-area padding, explicit pause/resume and optional-effects controls.

## If the website address does not work

1. In the repository's Code view, confirm the file path is exactly **applications/dino-runner/index.html**.
2. Confirm the extracted app includes `src`, `assets`, `sw.js` and its metadata files, without an extra nested app folder.
3. Confirm your commit was pushed to **main**.
4. In **Actions → Verify and deploy Pages**, confirm the latest run's build **and publish** jobs are green.
5. Open the HTTPS website address above with its final slash. After deployment, refresh the page; if an old installed version remains, accept its update offer.

A failed shared Pages publish job can leave the previous website live without this new app. Inspect that failure rather than deleting or replacing other applications.
