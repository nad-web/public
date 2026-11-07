/* Designed & developed by Noorullah Adel · 2026. MIT. */
import {
  createGame,
  startGame,
  pauseGame,
  tick,
  missions,
  dateKey,
  STEP,
  MODES,
} from "./engine.js";
import { createRenderer } from "./render.js";
import { createAudio } from "./audio.js";
import { createRecords } from "./storage.js";
import { initPWA } from "./pwa.js";
const $ = (id) => document.getElementById(id),
  canvas = $("game"),
  overlay = $("screen-overlay"),
  sound = createAudio();
const records = createRecords({
  onWarning: (message) => {
    $("storage-notice").textContent = message;
    $("storage-notice").hidden = false;
  },
});
let saved = records.read(),
  prefs = saved.prefs,
  game = createGame({ mode: prefs.mode }),
  renderer,
  particles = [],
  pendingJump = false,
  raf = 0,
  lastFrame = 0,
  accumulator = 0,
  lastHUD = 0,
  lastAutoSave = 0,
  runId = "",
  lastSavedSnapshot = "",
  dialogOpen = false,
  previousFocus,
  noticeTimer,
  announcementTimer;
const media = window.matchMedia?.("(prefers-reduced-motion: reduce)"),
  effectivePrefs = () => ({
    ...prefs,
    reduced: !prefs.motion || media?.matches === true,
  }),
  format = (n) => Math.floor(n).toLocaleString("en-US");
sound.setEnabled(prefs.sound);
function announce(message) {
  clearTimeout(announcementTimer);
  $("announcer").textContent = "";
  announcementTimer = setTimeout(() => {
    $("announcer").textContent = message;
  }, 30);
}
function notify(message) {
  clearTimeout(noticeTimer);
  $("run-notice").textContent = message;
  announce(message);
  noticeTimer = setTimeout(() => {
    $("run-notice").textContent = "";
  }, 3600);
}
function draw() {
  renderer?.draw(game, effectivePrefs(), particles);
}
function updateSoundButton() {
  const button = $("sound-button");
  button.setAttribute("aria-pressed", String(prefs.sound));
  $("sound-label").textContent = prefs.sound ? "Sound on" : "Sound off";
  button.title = prefs.sound ? "Turn fish sounds off" : "Turn fish sounds on";
  button
    .querySelector("path")
    .setAttribute(
      "d",
      prefs.sound
        ? "m10 5-5 4H2v6h3l5 4V5Zm5 3c4 2 4 6 0 8m3-11c6 4 6 10 0 14"
        : "m10 5-5 4H2v6h3l5 4V5Zm5 4 5 6m0-6-5 6",
    );
}
function updateBest() {
  saved = records.read();
  const value =
    game.mode === "daily"
      ? saved.best.daily[game.date] || 0
      : saved.best[game.mode] || 0;
  $("best-score").replaceChildren(
    document.createTextNode(format(value)),
    Object.assign(document.createElement("span"), { textContent: " PTS" }),
  );
  $("best-context").textContent =
    game.mode === "daily"
      ? `${game.date} · saved on this device`
      : `${MODES[game.mode].name} · saved on this device`;
  $("total-runs").textContent = format(saved.stats.runs);
  $("total-fish").textContent = format(saved.stats.fish);
}
function updateHUD() {
  $("score").textContent = String(game.score).padStart(5, "0");
  $("fish-count").textContent = game.fishCount;
  $("distance").textContent = game.distance + " m";
  $("lives").textContent = Array.from({ length: 3 }, (_, i) =>
    i < game.lives ? "♥" : "♡",
  ).join(" ");
  $("lives").setAttribute(
    "aria-label",
    `${game.lives} ${game.lives === 1 ? "life" : "lives"}`,
  );
  $("combo").hidden = game.combo < 2;
  $("combo").textContent = "×" + game.combo;
  const tasks = missions(game);
  tasks.forEach((m, i) => {
    const value = Math.min(m.value, m.target);
    $("mission-" + i).value = value;
    $("mission-value-" + i).textContent = m.complete
      ? "Done ✓"
      : `${value} / ${m.target}`;
    $("mission-" + i)
      .closest("li")
      .classList.toggle("mission-done", m.complete);
  });
  $("mission-count").textContent =
    tasks.filter((m) => m.complete).length + " / 3";
}
function recordRun() {
  const signature = `${runId}:${game.score}:${game.fishCount}:${game.distance}`;
  if (!runId || game.time < 0.1 || lastSavedSnapshot === signature) return;
  lastSavedSnapshot = signature;
  saved = records.saveRun(runId, game);
  updateBest();
}
function changePreferences(patch) {
  saved = records.preferences(patch);
  prefs = saved.prefs;
  document.body.dataset.sky = prefs.sky;
  $("sky-label").textContent =
    prefs.sky === "moonlight" ? "Moonlight" : "Golden hour";
  $("sky-select").value = prefs.sky;
  $("cat-select").value = prefs.cat;
  $("motion-toggle").checked = prefs.motion;
  updateSoundButton();
  draw();
}
function showOverlay(phase) {
  overlay.hidden = false;
  $("menu-button").hidden = phase === "ready";
  $("menu-button").textContent =
    phase === "paused" ? "Finish this run" : "Choose another pace";
  $("result-grid").hidden = !["over", "complete"].includes(phase);
  $("overlay-hint").hidden = phase === "paused";
  const content = {
    ready: [
      "YOUR NEXT LITTLE ESCAPE",
      "A skyline.\nA curious little cat.",
      "A few rooftops, a pocketful of fish,\nand nowhere you need to be.",
      "Let’s go →",
    ],
    paused: [
      "A MOMENT TO CATCH YOUR BREATH",
      "The rooftops can wait.",
      "Your little adventure is right here.\nResume whenever you’re ready.",
      "Keep exploring →",
    ],
    over: [
      "EVERY LITTLE ADVENTURE COUNTS",
      "Same cat.\nA fresh beginning.",
      "A few brave leaps and a story to tell.\nThere’s always another rooftop.",
      "One more adventure →",
    ],
    complete: [
      "YOU FOUND YOUR WAY",
      "A thousand meters.\nOne very happy cat.",
      "Today’s route is complete.\nThe skyline will be here tomorrow.",
      "Wander again →",
    ],
  }[phase];
  $("overlay-kicker").textContent = content[0];
  $("overlay-title").textContent = content[1];
  $("overlay-title").style.whiteSpace = "pre-line";
  $("overlay-description").textContent = content[2];
  $("overlay-description").style.whiteSpace = "pre-line";
  $("start-button").textContent = content[3];
  $("result-score").textContent = format(game.score);
  $("result-fish").textContent = game.fishCount;
  $("result-distance").textContent = game.distance + " m";
  $("pause-button").disabled = phase !== "paused";
  $("pause-button").setAttribute(
    "aria-label",
    phase === "paused" ? "Resume game" : "Pause game",
  );
  $("jump-button").disabled = true;
}
function setMode(mode) {
  if (game.phase === "running" || game.phase === "paused") return;
  changePreferences({ mode });
  game = createGame({ mode });
  particles = [];
  lastSavedSnapshot = "";
  runId = "";
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.mode === mode)),
    );
  $("mode-label").textContent = MODES[mode].name;
  $("mode-tip").textContent = {
    cozy: "Three hearts and a gentler skyline. A lovely place to start.",
    chase:
      "Faster rooftops and a few more chimneys. Find your double-jump rhythm.",
    daily: `${game.date} · Reach 1,000 m. The same route for every try today.`,
  }[mode];
  showOverlay("ready");
  updateHUD();
  updateBest();
  draw();
}
function focusGame() {
  try {
    canvas.focus({ preventScroll: true });
  } catch {
    canvas.focus();
  }
}
function schedule() {
  if (!raf && !document.hidden) {
    lastFrame = 0;
    accumulator = 0;
    raf = requestAnimationFrame(frame);
  }
}
function start() {
  if (dialogOpen) return;
  if (game.phase !== "paused") {
    recordRun();
    game = createGame({
      mode: prefs.mode,
      date: dateKey(),
      seed: `${Date.now()}-${Math.random()}`,
    });
    runId =
      globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    lastSavedSnapshot = "";
    lastAutoSave = 0;
    particles = [];
  }
  startGame(game);
  overlay.hidden = true;
  $("pause-button").disabled = false;
  $("pause-button").setAttribute("aria-label", "Pause game");
  $("jump-button").disabled = false;
  document.querySelectorAll("[data-mode]").forEach((b) => (b.disabled = true));
  pendingJump = false;
  sound.setEnabled(prefs.sound);
  sound.unlock();
  focusGame();
  updateHUD();
  updateBest();
  schedule();
  if (game.mode === "daily")
    $("mode-tip").textContent =
      `${game.date} · Reach 1,000 m. The same route for every try today.`;
  if (
    window.matchMedia(
      "(max-width: 850px), (max-height: 520px) and (orientation: landscape)",
    ).matches
  )
    $("play").scrollIntoView({
      block: "start",
      behavior: effectivePrefs().reduced ? "auto" : "smooth",
    });
  announce(
    "Adventure started. Tap or press Space to jump, and again to double jump.",
  );
}
function pause(reason = "Paused. Resume when you are ready.") {
  if (!pauseGame(game)) return;
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  pendingJump = false;
  sound.suspend();
  recordRun();
  showOverlay("paused");
  updateHUD();
  draw();
  announce(reason);
}
function finish() {
  recordRun();
  sound.quiet();
  showOverlay(game.phase);
  document.querySelectorAll("[data-mode]").forEach((b) => (b.disabled = false));
  updateHUD();
  draw();
  announce(
    `${game.phase === "complete" ? "Daily route complete." : "Adventure finished."} Score ${game.score}, ${game.fishCount} fish, ${game.distance} meters.`,
  );
  $("start-button").focus({ preventScroll: true });
}
function frame(time) {
  raf = 0;
  if (game.phase !== "running" || document.hidden) return;
  const dt = lastFrame ? Math.min(0.05, (time - lastFrame) / 1000) : 0;
  lastFrame = time;
  accumulator += dt;
  while (accumulator >= STEP && game.phase === "running") {
    const events = tick(game, STEP, { jump: pendingJump });
    pendingJump = false;
    accumulator -= STEP;
    for (const p of particles) p.age += STEP;
    particles = particles.filter((p) => p.age < 0.75);
    for (const e of events) {
      if (e.type === "fish") {
        sound.fish(e.gold);
        if (!effectivePrefs().reduced) particles.push({ ...e, age: 0 });
        if (e.combo === 5) notify("In the flow · ×5 fish streak!");
      }
      if (e.type === "jump" && !effectivePrefs().reduced)
        particles.push({
          type: "dust",
          x: game.player.x,
          y: game.player.y + game.player.h,
          age: 0,
        });
      if (e.type === "hurt" && e.lives > 0)
        notify(
          `A little tumble. ${e.lives} ${e.lives === 1 ? "heart" : "hearts"} left · try another leap.`,
        );
    }
  }
  if (game.phase === "running" && game.time - lastAutoSave >= 5) {
    lastAutoSave = game.time;
    recordRun();
  }
  if (time - lastHUD > 80) {
    updateHUD();
    lastHUD = time;
  }
  draw();
  if (game.phase === "running") raf = requestAnimationFrame(frame);
  else finish();
}
function jump() {
  if (dialogOpen || game.phase !== "running") return;
  pendingJump = true;
  sound.unlock();
}
function bindJump(target) {
  if ("PointerEvent" in window)
    target.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.isPrimary === false) return;
      e.preventDefault();
      jump();
      try {
        target.setPointerCapture(e.pointerId);
      } catch {}
    });
  else {
    target.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        jump();
      },
      { passive: false },
    );
    target.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        e.preventDefault();
        jump();
      }
    });
  }
}
bindJump(canvas);
bindJump($("jump-button"));
$("jump-button").addEventListener("click", (e) => {
  if (e.detail === 0) jump();
});
$("start-button").addEventListener("click", start);
$("pause-button").addEventListener("click", () =>
  game.phase === "paused" ? start() : pause(),
);
$("menu-button").addEventListener("click", () => {
  recordRun();
  document.querySelectorAll("[data-mode]").forEach((b) => (b.disabled = false));
  game.phase = "ready";
  setMode(prefs.mode);
});
document
  .querySelectorAll("[data-mode]")
  .forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
window.addEventListener("keydown", (e) => {
  if (dialogOpen) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
    }
    if (e.key === "Tab") trapFocus(e);
    return;
  }
  if (e.target.closest?.("button,a,input,select,textarea")) return;
  if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
    e.preventDefault();
    if (!e.repeat) jump();
  }
  if (["KeyP", "Escape"].includes(e.code) && !e.repeat) {
    e.preventDefault();
    game.phase === "running" ? pause() : game.phase === "paused" && start();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause("Adventure paused while you were away.");
});
window.addEventListener("pagehide", () => {
  pause();
  recordRun();
});
$("sound-button").addEventListener("click", async () => {
  changePreferences({ sound: !prefs.sound });
  sound.setEnabled(prefs.sound);
  if (prefs.sound) {
    if (await sound.unlock()) sound.fish();
    else notify("Your browser could not start sound. Tap Sound to try again.");
  }
});
function openDialog(kind, title) {
  pause();
  previousFocus = document.activeElement;
  dialogOpen = true;
  $("dialog-title").textContent = title;
  for (const id of ["install", "how", "settings", "credits"])
    $(id + "-content").hidden = id !== kind;
  if (kind === "settings") updateBest();
  $("dialog-backdrop").hidden = false;
  $("info-dialog").hidden = false;
  document.body.style.overflow = "hidden";
  $("close-dialog").focus();
}
function closeDialog() {
  dialogOpen = false;
  $("info-dialog").hidden = true;
  $("dialog-backdrop").hidden = true;
  document.body.style.overflow = "";
  (previousFocus?.isConnected && !previousFocus.disabled
    ? previousFocus
    : $("start-button")
  ).focus({ preventScroll: true });
}
function trapFocus(e) {
  const items = [
      ...$("info-dialog").querySelectorAll(
        "button:not(:disabled),a[href],select,input:not(:disabled),summary",
      ),
    ].filter((el) => el.getClientRects().length > 0),
    first = items[0],
    last = items.at(-1);
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
$("close-dialog").addEventListener("click", closeDialog);
$("dialog-done").addEventListener("click", closeDialog);
$("dialog-backdrop").addEventListener("click", closeDialog);
$("how-button").addEventListener("click", () =>
  openDialog("how", "A few little pointers."),
);
$("settings-button").addEventListener("click", () =>
  openDialog("settings", "Your kind of adventure."),
);
$("credits-button").addEventListener("click", () =>
  openDialog("credits", "Made with a little curiosity."),
);
$("sky-select").addEventListener("change", (e) =>
  changePreferences({ sky: e.target.value }),
);
$("cat-select").addEventListener("change", (e) =>
  changePreferences({ cat: e.target.value }),
);
$("motion-toggle").addEventListener("change", (e) =>
  changePreferences({ motion: e.target.checked }),
);
$("reset-confirm").addEventListener("change", (e) => {
  $("reset-button").disabled = !e.target.checked;
});
$("reset-button").addEventListener("click", () => {
  if (!$("reset-confirm").checked) return;
  saved = records.reset();
  prefs = saved.prefs;
  sound.setEnabled(false);
  game.phase = "ready";
  runId = "";
  setMode("cozy");
  document.querySelectorAll("[data-mode]").forEach((b) => (b.disabled = false));
  $("reset-confirm").checked = false;
  $("reset-button").disabled = true;
  closeDialog();
  notify("Rooftop Cat’s local progress has been reset.");
});
$("export-button").addEventListener("click", () => {
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(records.read(), null, 2)], {
        type: "application/json",
      }),
    ),
    link = document.createElement("a");
  link.href = url;
  link.download = `rooftop-cat-scores-${dateKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  notify("Score records prepared. Your browser controls the download.");
});
window.addEventListener("storage", (e) => {
  if (e.key === records.key) updateBest();
});
try {
  renderer = createRenderer(canvas);
  setMode(prefs.mode);
  changePreferences({});
  if ("ResizeObserver" in window)
    new ResizeObserver(() => {
      renderer.resize();
      draw();
    }).observe(canvas);
  else
    window.addEventListener("resize", () => {
      renderer.resize();
      draw();
    });
  media?.addEventListener?.("change", draw);
} catch (e) {
  $("overlay-title").textContent = "This browser couldn’t open the skyline.";
  $("overlay-description").textContent =
    "Try a current browser with JavaScript and Canvas enabled.";
  $("start-button").disabled = true;
  $("overlay-hint").textContent = e.message;
}
initPWA({
  onInstallGuide: () => openDialog("install", "Take the rooftops with you."),
  beforeUpdate: () => {
    pause();
    recordRun();
  },
  notify,
});
