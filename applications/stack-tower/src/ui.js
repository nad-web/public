/* Original tiny arcade shell. Noorullah Adel, 2026. MIT. */
import { createAudio } from "./audio.js";
import { createRecords } from "./records.js";
import { createScreen } from "./fullscreen.js";
import { initPWA } from "./pwa.js";
export const $ = (id) => document.getElementById(id);
export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
export function button(text, cls, fn) {
  const n = el("button", cls, text);
  n.type = "button";
  if (fn) n.addEventListener("click", fn);
  return n;
}
export function initUI({
  kind,
  name,
  onPause,
  onHome,
  onConflict,
  onResize = () => {},
  help = [],
}) {
  let returnFocus, timer;
  const audio = createAudio(),
    reduced = matchMedia("(prefers-reduced-motion: reduce)"),
    scope = new URL("../", import.meta.url),
    records = createRecords(kind, scope.pathname, () => {
      onConflict();
      paintPrefs();
      toast("Another tab saved newer records. Reload before continuing.");
    });
  const screen = createScreen({
    onExitNative: () => onPause("Fullscreen ended. Your game is paused."),
    changed: onResize,
  });
  function toast(text) {
    clearTimeout(timer);
    $("toast").textContent = text;
    $("toast").hidden = false;
    $("live-status").textContent = text;
    timer = setTimeout(() => ($("toast").hidden = true), 4200);
  }
  function close() {
    const d = $("dialog");
    if (typeof d.close === "function") d.close();
    else d.removeAttribute("open");
    document.body.classList.remove("modal-open", "dialog-fallback");
    returnFocus?.focus({ preventScroll: true });
  }
  function panel(title, build) {
    onPause("Paused while this panel is open.");
    if ($("dialog").hasAttribute("open")) close();
    returnFocus = document.activeElement;
    $("dialog-title").textContent = title;
    $("dialog-body").replaceChildren();
    build($("dialog-body"));
    document.body.classList.add("modal-open");
    if (typeof $("dialog").showModal === "function") $("dialog").showModal();
    else {
      $("dialog").setAttribute("open", "");
      document.body.classList.add("dialog-fallback");
    }
    $("close-dialog").focus();
  }
  function paintPrefs() {
    audio.setEnabled(records.data.prefs.sound);
    document.body.dataset.effects = String(
      records.data.prefs.effects && !reduced.matches,
    );
    for (const id of ["sound-home", "sound-play"]) {
      $(id).setAttribute("aria-pressed", String(records.data.prefs.sound));
      $(id).setAttribute(
        "aria-label",
        records.data.prefs.sound ? "Turn sound off" : "Turn sound on",
      );
      $(id).textContent = records.data.prefs.sound ? "♫" : "♩";
    }
    $("record-warning").textContent = records.conflicted
      ? "Another tab changed these records. Reload to continue."
      : records.problem === "invalid"
        ? "An unreadable older record is preserved. Play this visit or reset this game in Settings."
        : records.problem
          ? "Scores are kept for this visit; browser saving is unavailable or full."
          : "";
  }
  async function toggleSound() {
    records.write((d) => {
      d.prefs.sound = !d.prefs.sound;
    });
    paintPrefs();
    if (records.data.prefs.sound && (await audio.unlock()))
      audio.play("milestone");
  }
  function settings() {
    panel("Make it yours", (body) => {
      body.append(
        el("p", "muted", "Your sound, your pace. No account or tracking."),
      );
      for (const [key, label, detail] of [
        ["sound", "Sound", "Short original synthesized chimes. Off initially."],
        [
          "effects",
          "Extra effects",
          "Optional tile transitions, falling pieces and smooth camera motion. Reduced-motion settings take priority.",
        ],
      ]) {
        const row = el("div", "setting-row"),
          copy = el("div");
        copy.append(el("strong", "", label), el("small", "muted", detail));
        const b = button(
          records.data.prefs[key] ? "On" : "Off",
          "pill",
          async () => {
            records.write((d) => {
              d.prefs[key] = !d.prefs[key];
            });
            b.textContent = records.data.prefs[key] ? "On" : "Off";
            b.setAttribute("aria-pressed", String(records.data.prefs[key]));
            paintPrefs();
            if (key === "sound" && records.data.prefs.sound)
              await audio.unlock();
          },
        );
        b.setAttribute("aria-label", label);
        b.setAttribute("aria-pressed", String(records.data.prefs[key]));
        row.append(copy, b);
        body.append(row);
      }
      body.append(
        el("h3", "", "Your recent games"),
        el(
          "p",
          "muted",
          `Games started in this browser: ${records.data.plays}.`,
        ),
      );
      if (!records.data.recent.length)
        body.append(
          el("p", "muted", "Finish a game to start your little history."),
        );
      for (const r of records.data.recent) {
        const row = el("div", "history-row");
        row.append(
          el(
            "span",
            "",
            `${r.mode.toUpperCase()} · ${new Date(r.at).toLocaleDateString()}`,
          ),
          el(
            "strong",
            "",
            kind === "word"
              ? `${r.score} pts · ${r.solved} words`
              : `${r.height} blocks · ${r.score} pts`,
          ),
        );
        body.append(row);
      }
      body.append(
        button("Reset this game’s records", "text-button", () =>
          panel("A fresh start?", (b) => {
            b.append(
              el(
                "p",
                "muted",
                "This ends the current game and clears only this app’s best scores and recent games. Your sound and effects settings stay.",
              ),
            );
            const label = el("label", "check"),
              check = el("input");
            check.type = "checkbox";
            label.append(
              check,
              el("span", "", "I want to reset this game’s records."),
            );
            const reset = button("Reset records", "action", () => {
              if (records.reset()) {
                close();
                onHome(true);
                paintPrefs();
                toast("Your next fresh start is ready.");
              }
            });
            reset.disabled = true;
            check.addEventListener(
              "change",
              () => (reset.disabled = !check.checked),
            );
            b.append(label, reset);
          }),
        ),
      );
      body.append(
        el(
          "p",
          "fine",
          "Local records do not sync between devices. Reload starts a fresh game. Detected changes in another tab require reload; saving progress does not restore an active game.",
        ),
      );
    });
  }
  function install() {
    panel("Your pocket arcade", (body) => {
      body.append(el("h3", "", "iPhone · app-style play"));
      const list = el("ol");
      for (const text of [
        "Open this game in Safari using its deployed HTTPS address.",
        "Tap Share (or Page Menu → Share), then Add to Home Screen. Use Edit Actions if it is missing.",
        "Turn on Open as Web App when offered, then tap Add.",
        "Launch the new icon online once. Wait for “Ready for offline play” before checking it in Airplane Mode.",
      ])
        list.append(el("li", "", text));
      body.append(
        list,
        el(
          "p",
          "note",
          "Play switches to a dedicated, screen-filling view with safe-area padding. Native fullscreen is requested only where supported. A normal Safari tab can keep its browser bars; the Home Screen web app is the app-style route on iPhone. System status/gesture areas remain controlled by iOS.",
        ),
        el("h3", "", "Other browsers"),
        el(
          "p",
          "muted",
          "Use your browser’s Install app or Add to Home screen command when offered. Normal browser play also works. The in-app Fullscreen button retries native fullscreen where available.",
        ),
        el("p", "note", $("offline-status").textContent),
        button("Check offline files", "pill", async () => {
          await pwa.check(true);
          toast($("offline-status").textContent);
        }),
        el(
          "p",
          "fine",
          "First preparation and updates require a connection. Browser data may be evicted. The installed icon and browser tab may have separate data; open each online once. Installation availability depends on your browser and OS.",
        ),
      );
    });
  }
  function how() {
    panel("A tiny guide", (body) => {
      const list = el("ol");
      help.forEach((t) => list.append(el("li", "", t)));
      body.append(
        list,
        el("h3", "", "Designed & developed by"),
        el("p", "credit", "Noorullah Adel · 2026"),
        el(
          "p",
          "muted",
          `${name} uses original game code, artwork, icons, text and synthesized sounds under the included MIT License. It bundles no third-party runtime libraries, fonts, recordings or game assets.`,
        ),
        el(
          "p",
          "fine",
          "Licensing and foundation credits are included in LICENSE and THIRD_PARTY_NOTICES.md.",
        ),
      );
    });
  }
  for (const id of ["sound-home", "sound-play"])
    $(id).addEventListener("click", toggleSound);
  for (const id of ["help-home", "help-play"])
    $(id).addEventListener("click", how);
  $("settings-home").addEventListener("click", settings);
  $("footer-help").addEventListener("click", how);
  $("close-dialog").addEventListener("click", close);
  $("home-button").addEventListener("click", () =>
    onPause("Take a breather. Resume, or return to the menu."),
  );
  $("fullscreen-button").addEventListener("click", async () => {
    if (!(await screen.toggle()) && !document.fullscreenElement)
      toast("For app-style iPhone play, open the Home Screen icon.");
  });
  $("dialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  $("dialog").addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [
        ...$("dialog").querySelectorAll(
          "button:not(:disabled),input,select,a[href]",
        ),
      ].filter((n) => n.getClientRects().length),
      a = items[0],
      z = items.at(-1);
    if (e.shiftKey && document.activeElement === a) {
      e.preventDefault();
      z?.focus();
    } else if (!e.shiftKey && document.activeElement === z) {
      e.preventDefault();
      a?.focus();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      onPause("Paused while you were away.");
      audio.quiet();
    }
  });
  window.addEventListener("blur", () => {
    onPause("Paused while you were away.");
    audio.quiet();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === records.key || e.key === null) {
      records.markConflict();
      paintPrefs();
      toast("Another tab changed these records. Reload before continuing.");
    }
  });
  reduced.addEventListener?.("change", paintPrefs);
  const pwa = initPWA({
    onInstallGuide: install,
    beforeUpdate: () => {
      onPause("Paused before updating.");
      audio.quiet();
    },
    notify: toast,
  });
  paintPrefs();
  return {
    records,
    audio,
    screen,
    reduced,
    panel,
    close,
    toast,
    paintPrefs,
    install,
  };
}
