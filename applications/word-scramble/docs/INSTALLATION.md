# Word Scramble on your Home Screen

1. Open https://nad-web.github.io/public/applications/word-scramble/ in Safari online.
2. Tap Share, or Page Menu then Share. Choose Add to Home Screen. If missing, check Edit Actions.
3. Enable Open as Web App when offered, then Add.
4. Open the new icon online and wait for **Ready for offline play**.
5. Tap Play. The game uses the available screen with safe-area padding. Test reopening the icon in Airplane Mode, then reconnect for updates.

A normal Safari tab can retain browser bars. Native fullscreen is feature-detected rather than promised on every iPhone. Installed web apps are the app-style route; iOS still controls system areas. Both portrait and landscape layouts are provided. Opening another app or a panel pauses gameplay. Resume explicitly.

Other browsers can offer Install app, Add to Home screen or supported Safari Add to Dock. The in-app Install now button appears only when the browser supplies an install prompt. The game also works as a normal web page.

First cache preparation, repair and updates require HTTPS and a connection; localhost is supported for development. A successful readiness check means the required files are cached now, not forever. Storage may be evicted; the browser and installed icon can have separate scores/cache. Clearing website data removes it. Sound is off initially and needs a user gesture to unlock; device and browser policies can still suppress it.

If the deployed URL is missing, confirm `applications/word-scramble/index.html`, ensure the whole extracted app folder was pushed to main, then check that your latest GitHub Pages build and publish jobs are green. Shared deployment failures must be resolved before a new app URL can appear.

Official references checked for this release:

- https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
