/* Dino Runner. Designed & developed by Noorullah Adel, 2026. MIT. */
import {
  MODES,
  createGame,
  startGame,
  pauseGame,
  resumeGame,
  requestJump,
  releaseJump,
  setDucking,
  advance,
  snapshot,
  goals,
} from "./engine.js";
import { createRenderer, nightMode } from "./render.js";
import { SKINS } from "./sprites.js";
import { defaults, validateRecord, recordRun } from "./records.js";
import { createStorage } from "./storage.js";
import { createAudio } from "./audio.js";
import { initPWA } from "./pwa.js";
const $ = (id) => document.getElementById(id),
  canvas = $("game"),
  reduced = matchMedia("(prefers-reduced-motion: reduce)"),
  rootURL = new URL("../", import.meta.url),
  audio = createAudio();
let backend;
try {
  backend = localStorage;
} catch {}
const storage = createStorage(
    backend,
    "noorullah:dino-runner:v1:" + rootURL.pathname,
    validateRecord,
  ),
  loaded = storage.load();
let record = loaded.state || defaults(),
  game = freshGame(),
  renderer = createRenderer(canvas),
  conflict = false,
  duckLatch = false,
  dirty = true,
  lastTime = 0,
  lastHud = 0,
  lastSaved = 0,
  lastIdleDraw = 0,
  bestAtStart = record.best[record.prefs.mode],
  pauseReason = "",
  endedAt = 0,
  toastTimer,
  returnFocus;
const jumpPointers = new Set(),
  keys = new Set(),
  dialogURLs = [];
function id() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }
}
function freshGame() {
  const runId = id();
  return createGame({ mode: record.prefs.mode, id: runId, seed: runId });
}
function element(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function button(text, cls, fn) {
  const b = element("button", cls, text);
  b.type = "button";
  if (fn) b.addEventListener("click", fn);
  return b;
}
function notify(text, announce = true) {
  clearTimeout(toastTimer);
  $("toast").textContent = text;
  $("toast").hidden = false;
  if (announce) $("game-status").textContent = text;
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 4200);
}
function warn(reason) {
  $("storage-warning").textContent =
    reason === "invalid"
      ? "An older score record could not be read and is preserved. Play this visit, export it in Settings, or explicitly reset this game's records."
      : reason
        ? "Saving is unavailable or full. Scores are kept for this visit; download your records in Settings to keep a copy."
        : "";
}
warn(loaded.error);
function releaseControls() {
  keys.clear();
  jumpPointers.clear();
  duckLatch = false;
  releaseJump(game);
  setDucking(game, false);
  dirty = true;
}
function markConflict() {
  conflict = true;
  pauseGame(game);
  releaseControls();
  pauseReason =
    "Another tab updated this game's records. Reload to use the latest saved scores.";
  render();
  notify(pauseReason);
}
function writeRecord(fn, { replaceBroken = false } = {}) {
  if (conflict) return false;
  const next = JSON.parse(JSON.stringify(record));
  if (fn(next) === false) return false;
  const result = storage.write(next, { replaceBroken });
  if (!result.ok && result.reason === "conflict") {
    markConflict();
    return false;
  }
  record = next;
  warn(result.ok ? null : result.reason);
  audio.setEnabled(record.prefs.sound);
  dirty = true;
  return true;
}
function saveSnapshot() {
  if (game.phase === "ready" || conflict) return;
  const data = snapshot(game);
  writeRecord((r) => recordRun(r, game.id, data));
  lastSaved = game.elapsed;
}
function newAttempt() {
  if (game.phase !== "ready") saveSnapshot();
  releaseControls();
  game = freshGame();
  bestAtStart = record.best[game.mode];
  lastSaved = 0;
  endedAt = 0;
  pauseReason = "";
  dirty = true;
  render();
}
function begin() {
  if (!renderer || conflict) {
    if (conflict) location.reload();
    return;
  }
  if (game.phase === "paused") {
    resume();
    return;
  }
  if (game.phase === "ended") {
    if (performance.now() - endedAt < 250) return;
    newAttempt();
  }
  if (startGame(game)) {
    lastTime = performance.now();
    saveSnapshot();
    render();
    canvas.focus({ preventScroll: true });
    audio
      .unlock()
      .then((ok) => ok && game.phase === "running" && audio.play("start"));
    $("game-status").textContent =
      `${MODES[game.mode].name} run started. Jump the cacti and duck under low flyers.`;
  }
}
function pause(message = "A little breather. Your run is waiting.") {
  if (pauseGame(game)) {
    releaseControls();
    pauseReason = message;
    saveSnapshot();
    render();
    audio.quiet();
    $("game-status").textContent = message;
  }
}
function resume() {
  if (conflict) {
    location.reload();
    return;
  }
  if (resumeGame(game)) {
    releaseControls();
    lastTime = performance.now();
    render();
    canvas.focus({ preventScroll: true });
    audio.unlock();
    $("game-status").textContent = "Run resumed.";
  }
}
function jump(held = true) {
  if ($("dialog").hasAttribute("open") || !renderer || conflict) return;
  if (game.phase === "paused") {
    resume();
    return;
  }
  if (game.phase === "ready" || game.phase === "ended") begin();
  if (game.phase !== "running") return;
  duckLatch = false;
  setDucking(game, keys.has("ArrowDown") || keys.has("KeyS"));
  requestJump(game, { held });
  dirty = true;
}
function toggleDuck() {
  if (game.phase !== "running") return;
  duckLatch = !duckLatch;
  applyDuck();
  renderHud();
}
function applyDuck() {
  setDucking(game, duckLatch || keys.has("ArrowDown") || keys.has("KeyS"));
  dirty = true;
}
function chooseMode(mode) {
  if (!Object.hasOwn(MODES, mode) || mode === record.prefs.mode || conflict)
    return;
  if (game.phase === "running")
    pause("Mode changed. Your progress so far is saved.");
  else saveSnapshot();
  if (
    writeRecord((r) => {
      r.prefs.mode = mode;
    })
  )
    newAttempt();
}
function renderOverlay() {
  const visible = game.phase !== "running";
  $("screen-overlay").hidden = !visible;
  if (!visible) return;
  const label = $("overlay-label"),
    title = $("overlay-title"),
    body = $("overlay-body"),
    start = $("start-button"),
    hint = $("overlay-hint");
  if (conflict) {
    label.textContent = "A FRESH RECORD IS WAITING";
    title.textContent = "Let's get\nback in sync.";
    body.textContent = pauseReason;
    start.firstChild.textContent = "Reload saved records ";
    hint.textContent = "Your other tab's record stays protected.";
  } else if (game.phase === "paused") {
    label.textContent = "NO RUSH, LITTLE LEGEND";
    title.textContent = "A little\nbreather.";
    body.textContent = pauseReason;
    start.firstChild.textContent = "Keep running ";
    hint.textContent = "Or press P / Escape / Space to resume";
  } else if (game.phase === "ended") {
    const finished = game.reason === "finished";
    label.textContent =
      game.score > bestAtStart
        ? "A NEW PERSONAL BEST"
        : finished
          ? "SIXTY SECONDS WELL SPENT"
          : "EVERY LITTLE LEAP COUNTS";
    title.textContent = finished
      ? "Sixty seconds.\nNicely done."
      : "Small arms.\nBig comeback.";
    body.textContent = `${game.score.toLocaleString()} points · ${Math.floor(game.distance / 10).toLocaleString()} metres\n${game.cleared} obstacles cleared. Fancy another go?`;
    start.firstChild.textContent = "Run again ";
    hint.textContent = "Or press Space / R for a fresh run";
  } else {
    label.textContent = "THE HORIZON IS CALLING";
    title.textContent = "Ready,\nlittle legend?";
    body.textContent =
      "An open desert. One curious dinosaur.\nLet's see what's out there.";
    start.firstChild.textContent = "Start running ";
    hint.textContent = "Or tap the desert / press Space";
  }
  start.disabled = !renderer;
}
function renderHud() {
  $("score").textContent = String(game.score).padStart(6, "0");
  $("run-distance").textContent = Math.floor(game.distance / 10) + " m";
  $("sprint-time").hidden = game.mode !== "sprint";
  $("sprint-time").textContent =
    Math.max(0, Math.ceil(60 - game.elapsed)) + " s";
  $("lives").textContent = game.lives > 0 ? "♥".repeat(game.lives) : "♡";
  $("lives").setAttribute(
    "aria-label",
    `${game.lives} ${game.lives === 1 ? "heart" : "hearts"} remaining`,
  );
  $("best-score").textContent = String(
    Math.max(record.best[game.mode], game.score),
  ).padStart(6, "0");
  $("best-mode").textContent =
    MODES[game.mode].name + " · saved in this browser";
  const night = nightMode(game, record.prefs, reduced.matches);
  $("game-surface").dataset.night = String(night);
  $("sky-label").textContent = night
    ? "A little moonlight adventure"
    : "A fresh little horizon";
  $("duck-button").setAttribute("aria-pressed", String(game.duckInput));
  $("duck-button").setAttribute(
    "aria-label",
    game.duckInput ? "Stop ducking" : "Toggle duck",
  );
  $("duck-button").disabled = game.phase !== "running" || conflict;
  $("jump-button").disabled = !renderer || conflict;
  $("pause-button").disabled =
    !["running", "paused"].includes(game.phase) || conflict;
  $("pause-button").setAttribute(
    "aria-label",
    game.phase === "paused" ? "Resume game" : "Pause game",
  );
  $("pause-symbol").textContent = game.phase === "paused" ? "▷" : "Ⅱ";
  const tasks = goals(game);
  $("goal-count").textContent =
    tasks.filter((t) => t.value >= t.target).length + " / 3";
  tasks.forEach((task, i) => {
    const row = $("goal-" + i);
    row.querySelector(".goal-number").textContent =
      `${Math.min(task.value, task.target)} / ${task.target}`;
    const progress = row.querySelector("progress");
    progress.value = Math.min(task.value, task.target);
    progress.setAttribute("aria-label", task.detail);
  });
}
function render() {
  $("mode-label").textContent = MODES[game.mode].name;
  for (const b of $("mode-options").children) {
    b.setAttribute("aria-pressed", String(b.dataset.mode === game.mode));
    b.disabled = conflict;
  }
  $("sound-button").setAttribute("aria-pressed", String(record.prefs.sound));
  $("sound-button").setAttribute(
    "aria-label",
    record.prefs.sound ? "Turn sound off" : "Turn sound on",
  );
  $("sound-text").textContent = record.prefs.sound ? "Sound on" : "Sound off";
  audio.setEnabled(record.prefs.sound);
  renderHud();
  renderOverlay();
  dirty = true;
}
function closeDialog() {
  for (const url of dialogURLs.splice(0))
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  if (typeof $("dialog").close === "function") $("dialog").close();
  else $("dialog").removeAttribute("open");
  document.body.style.overflow = "";
  document.body.classList.remove("dialog-fallback");
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
}
function openDialog(title, build) {
  if (game.phase === "running")
    pause("Paused while this panel is open. Resume when you are ready.");
  if ($("dialog").hasAttribute("open")) closeDialog();
  returnFocus = document.activeElement;
  $("dialog-title").textContent = title;
  $("dialog-body").replaceChildren();
  build($("dialog-body"));
  document.body.style.overflow = "hidden";
  if (typeof $("dialog").showModal === "function") $("dialog").showModal();
  else {
    $("dialog").setAttribute("open", "");
    document.body.classList.add("dialog-fallback");
  }
  $("close-dialog").focus();
}
function showHelp() {
  openDialog("A little guide to big adventures", (body) => {
    const list = element("ol");
    for (const text of [
      "Jump with Space, Arrow Up, W, or the JUMP button. Tap for a short hop; hold for a higher leap. Only one jump is available at a time.",
      "Hold Arrow Down or S to duck. On a phone, tap DUCK to toggle it on or off. Jump clears a touch-toggle duck. Down in the air brings you back down sooner.",
      "Clear cacti and rocks with a jump. Duck under low flyers. High flyers can pass overhead if you stay on the ground.",
      "Press P or Escape to pause/resume. Switching tabs, opening a panel or losing the browser's focus pauses the game. Resume explicitly when you're ready.",
      "Classic gives one heart; Chill is slower and gives three. 60s Sprint gives one heart and ends after sixty active game seconds if you survive.",
      "Each ten world units travelled count as one metre and one point. A clean obstacle pass adds five points. Fresh little goals appear every run.",
    ]) {
      list.append(element("li", "", text));
    }
    body.append(
      list,
      element(
        "p",
        "dialog-note",
        "Touch: use JUMP and DUCK together when needed. Keyboard: focus the game canvas for held jump controls. Controls do not repeat held keys into extra jumps. Escape closes a dialog first.",
      ),
      element("h3", "", "Keep your little progress"),
      element(
        "p",
        "",
        "Best scores and aggregate run records stay in this browser when storage is available. An active run is periodically saved as progress, but does not resume after a page reload. Reload starts a new attempt. Use one tab at a time; detected record conflicts pause the game until reload.",
      ),
      element("h3", "", "A note on motion"),
      element(
        "p",
        "",
        "The essential runner action relies on moving obstacles and visual timing. Reduced-motion preferences remove optional parallax, dust and hit blinking and keep automatic sky changes still. Paper or Night can be chosen explicitly in Settings.",
      ),
      button("Install & offline guide", "primary-button", showInstall),
    );
  });
}
function showInstall() {
  openDialog("A little desert in your pocket", (body) => {
    body.append(
      element(
        "p",
        "",
        "Install the game for quick access, or keep using the normal browser page.",
      ),
      element("h3", "", "iPhone & iPad · Safari"),
    );
    const list = element("ol");
    for (const text of [
      "Open the deployed game address in Safari over HTTPS.",
      "Tap Share, then Add to Home Screen. Check More or Edit Actions if needed.",
      "Enable Open as Web App when offered, then tap Add.",
      "Open the new icon online until ‘Ready for offline adventures’ appears in the footer. Then test by reopening in Airplane Mode.",
    ]) {
      list.append(element("li", "", text));
    }
    body.append(
      list,
      element("h3", "", "Android & desktop"),
      element(
        "p",
        "",
        "Use your browser's Install app, Add to Home screen, or supported Safari Add to Dock option. Availability varies by browser and operating system. Install now appears in this game only after the browser supplies a real install prompt.",
      ),
      element("h3", "", "Offline readiness"),
    );
    const status = element("p", "dialog-note", $("offline-status").textContent),
      check = button("Check offline setup", "soft-button", async () => {
        check.disabled = true;
        await pwa.check(true);
        status.textContent = $("offline-status").textContent;
        check.disabled = false;
      });
    body.append(
      status,
      check,
      element(
        "p",
        "",
        "First preparation and updates need a connection. Browser and installed-app storage may be separate; open the installed icon online once. Browser data can be cleared or evicted, so readiness is a current file check, not permanent storage. Physical-device installation and offline behaviour should be checked on your own devices.",
      ),
    );
  });
}
function showCredits() {
  openDialog("Small arms. Proper credits.", (body) => {
    body.append(
      element(
        "p",
        "",
        "Dino Runner was designed and developed by Noorullah Adel · 2026. Its engine, pixel dinosaur, flyers, desert artwork, icons, interface and synthesized chimes are original work provided under the included MIT License.",
      ),
      element("h3", "", "An affectionate inspiration"),
      element(
        "p",
        "",
        "Inspired by the offline dinosaur game in Chromium. That project's source carries a BSD-style license. This independent implementation bundles no Chromium source, sprites, sounds or Chrome-specific resources. It is not affiliated with or endorsed by Google or the Chromium project.",
      ),
      element("h3", "", "Local foundations"),
      element(
        "p",
        "",
        "Offline setup, source checks and validated storage foundations reuse original MIT-licensed modules from Noorullah Adel's Rooftop Cat and Boredom Roulette projects. No third-party runtime library, external font, recording, CDN or account service is bundled.",
      ),
      element(
        "p",
        "dialog-note",
        "Original code/artwork: MIT · Copyright 2026 Noorullah Adel. Preserve LICENSE and THIRD_PARTY_NOTICES.md when redistributing. The notices include source links and development-only icon tooling credits.",
      ),
    );
  });
}
function showRecords() {
  if (game.phase === "running") pause();
  openDialog("Your little journeys", (body) => {
    body.append(
      element(
        "p",
        "",
        `${record.stats.runs.toLocaleString()} runs started · ${record.stats.meters.toLocaleString()} metres travelled · ${record.stats.cleared.toLocaleString()} clean passes · ${record.stats.ducked.toLocaleString()} low flyers ducked.`,
      ),
    );
    if (!record.recent.length)
      body.append(
        element(
          "p",
          "dialog-note",
          "Your completed runs will appear here. Partial progress still contributes to your best scores and totals.",
        ),
      );
    for (const run of record.recent) {
      const row = element("div", "record-row"),
        copy = element("div");
      copy.append(
        element("strong", "", MODES[run.mode].name),
        element(
          "small",
          "",
          `${run.meters} m · ${run.seconds} active seconds · ${new Date(run.at).toLocaleDateString()}${run.reason === "finished" ? " · Sprint complete" : ""}`,
        ),
      );
      row.append(copy, element("span", "", String(run.score).padStart(6, "0")));
      body.append(row);
    }
    body.append(
      element(
        "p",
        "dialog-note",
        "These are local, single-player records. There is no account, online leaderboard or cross-device synchronization.",
      ),
    );
  });
}
function exportLink() {
  const link = element("a", "soft-button", "Download score records"),
    broken = storage.broken && storage.raw;
  let old;
  function prepare() {
    const content = broken
        ? storage.raw
        : JSON.stringify(
            {
              app: "dino-runner",
              version: 1,
              exportedAt: new Date().toISOString(),
              record,
              currentRun: game.phase === "ready" ? null : snapshot(game),
            },
            null,
            2,
          ),
      url = URL.createObjectURL(
        new Blob([content], {
          type: broken
            ? "text/plain;charset=utf-8"
            : "application/json;charset=utf-8",
        }),
      );
    if (old) {
      const previous = old;
      setTimeout(() => URL.revokeObjectURL(previous), 30000);
    }
    old = url;
    dialogURLs.push(url);
    link.href = url;
    link.download = broken
      ? "dino-runner-original-record.txt"
      : "dino-runner-scores.json";
  }
  prepare();
  link.addEventListener("click", prepare);
  return link;
}
function showReset() {
  openDialog("Start your records afresh?", (body) => {
    body.append(
      element(
        "p",
        "",
        "Reset this game's best scores, totals and recent runs at its current browser path. Your current attempt will end. Appearance and sound settings are kept. Download the record first if you want a copy.",
      ),
    );
    const label = element("label", "check-label"),
      check = element("input");
    check.type = "checkbox";
    label.append(
      check,
      element(
        "span",
        "",
        "I understand that Dino Runner's records in this browser will be reset.",
      ),
    );
    const reset = button("Reset these game records", "primary-button", () => {
      const prefs = { ...record.prefs };
      if (
        writeRecord((r) => Object.assign(r, defaults(), { prefs }), {
          replaceBroken: true,
        })
      ) {
        releaseControls();
        game = freshGame();
        lastSaved = 0;
        bestAtStart = 0;
        endedAt = 0;
        closeDialog();
        render();
        notify("A fresh little start. Your next run is waiting.");
      }
    });
    reset.disabled = true;
    check.addEventListener("change", () => (reset.disabled = !check.checked));
    body.append(label, reset);
  });
}
function showSettings() {
  openDialog("Make yourself at home", (body) => {
    function row(title, note, control) {
      const item = element("div", "settings-row"),
        copy = element("div");
      copy.append(element("strong", "", title), element("small", "", note));
      item.append(copy, control);
      body.append(item);
    }
    function choice(label, key, options, note) {
      const select = element("select");
      select.setAttribute("aria-label", label);
      for (const [value, text] of options) {
        const o = element("option", "", text);
        o.value = value;
        select.append(o);
      }
      select.value = record.prefs[key];
      select.addEventListener("change", () => {
        writeRecord((r) => {
          r.prefs[key] = select.value;
        });
        render();
      });
      row(label, note, select);
    }
    choice(
      "Your little dinosaur",
      "skin",
      Object.entries(SKINS).map(([key, s]) => [key, s.name]),
      "Original pixel friends. Same little legs.",
    );
    choice(
      "The horizon",
      "theme",
      [
        ["auto", "Day & night"],
        ["paper", "Paper daylight"],
        ["night", "Moonlight"],
      ],
      "Automatic skies alternate every 300 metres when optional effects are on.",
    );
    function toggle(label, key, note) {
      const b = button(record.prefs[key] ? "On" : "Off", "switch", async () => {
        if (
          writeRecord((r) => {
            r.prefs[key] = !r.prefs[key];
          })
        ) {
          b.textContent = record.prefs[key] ? "On" : "Off";
          b.setAttribute("aria-pressed", String(record.prefs[key]));
          render();
          if (key === "sound" && record.prefs.sound) {
            if (await audio.unlock()) audio.play("milestone");
            else
              notify(
                "Sound isn't available right now. Silent play still works.",
              );
          }
        }
      });
      b.setAttribute("aria-label", label);
      b.setAttribute("aria-pressed", String(record.prefs[key]));
      row(label, note, b);
    }
    toggle(
      "A little sound",
      "sound",
      "Short original jump, collision and milestone chimes. Off initially.",
    );
    toggle(
      "Extra little effects",
      "effects",
      "Optional parallax, dust, sky cycling and hit blinking. System reduced-motion preferences take priority.",
    );
    body.append(
      element("h3", "", "Your records stay with you"),
      element(
        "p",
        "",
        "Scores are saved locally when browser storage is available. A JSON download is a readable copy of your record, not an automatic restore/import file. Clearing site data can remove progress.",
      ),
    );
    const actions = element("div", "dialog-actions");
    actions.append(
      exportLink(),
      button("Reset game records", "text-button", showReset),
    );
    body.append(
      actions,
      element(
        "p",
        "dialog-note",
        "Changing game mode starts a fresh attempt. Your current progress is saved first. Opening this panel pauses a running game; close it and resume when ready.",
      ),
    );
  });
}
for (const [i, task] of goals(game).entries()) {
  const row = element("div", "goal-item");
  row.id = "goal-" + i;
  const line = element("div"),
    progress = element("progress");
  progress.max = task.target;
  progress.value = 0;
  line.append(
    element("span", "", task.detail),
    element("span", "goal-number", "0 / " + task.target),
  );
  row.append(element("strong", "", task.title), line, progress);
  $("goals-list").append(row);
}
$("start-button").addEventListener("click", () =>
  game.phase === "paused" ? resume() : begin(),
);
$("pause-button").addEventListener("click", () =>
  game.phase === "running" ? pause() : resume(),
);
for (const b of $("mode-options").children)
  b.addEventListener("click", () => chooseMode(b.dataset.mode));
function pointerJump(e) {
  if (e.button !== 0 || jumpPointers.has(e.pointerId)) return;
  e.preventDefault();
  if (jumpPointers.size > 0) return;
  jump(true);
  jumpPointers.add(e.pointerId);
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {}
}
for (const target of [canvas, $("jump-button")]) {
  target.addEventListener("pointerdown", pointerJump);
  target.addEventListener("click", (e) => {
    if (e.detail === 0) jump(false);
  });
  target.addEventListener("contextmenu", (e) => e.preventDefault());
}
function pointerEnd(e) {
  if (!jumpPointers.has(e.pointerId)) return;
  jumpPointers.delete(e.pointerId);
  if (!jumpPointers.size) releaseJump(game);
}
window.addEventListener("pointerup", pointerEnd);
window.addEventListener("pointercancel", pointerEnd);
canvas.addEventListener("lostpointercapture", pointerEnd);
$("jump-button").addEventListener("lostpointercapture", pointerEnd);
$("duck-button").addEventListener("pointerdown", (e) => {
  if (e.button === 0) {
    e.preventDefault();
    toggleDuck();
  }
});
$("duck-button").addEventListener("click", (e) => {
  if (e.detail === 0) toggleDuck();
});
$("duck-button").addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("keydown", (e) => {
  if ($("dialog").hasAttribute("open")) return;
  if (e.target.closest?.("input,select,textarea,button,a")) return;
  if (
    [
      "Space",
      "ArrowUp",
      "KeyW",
      "ArrowDown",
      "KeyS",
      "KeyP",
      "Escape",
      "KeyR",
    ].includes(e.code)
  )
    e.preventDefault();
  else return;
  if (e.repeat || keys.has(e.code)) return;
  keys.add(e.code);
  if (["Space", "ArrowUp", "KeyW"].includes(e.code)) jump(true);
  else if (["ArrowDown", "KeyS"].includes(e.code)) applyDuck();
  else if (["KeyP", "Escape"].includes(e.code)) {
    if (game.phase === "running") pause();
    else if (game.phase === "paused") resume();
  } else if (e.code === "KeyR" && game.phase === "ended") begin();
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  if (
    ["Space", "ArrowUp", "KeyW"].includes(e.code) &&
    !["Space", "ArrowUp", "KeyW"].some((k) => keys.has(k)) &&
    !jumpPointers.size
  )
    releaseJump(game);
  if (["ArrowDown", "KeyS"].includes(e.code)) applyDuck();
});
window.addEventListener("blur", () => {
  if (game.phase === "running")
    pause("Paused while you were away. Resume when you're ready.");
  else releaseControls();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (game.phase === "running")
      pause("Paused while you were away. Resume when you're ready.");
    else releaseControls();
    audio.quiet();
  } else {
    lastTime = performance.now();
    dirty = true;
  }
});
window.addEventListener("pagehide", saveSnapshot);
window.addEventListener("storage", (e) => {
  if (e.key === storage.key || e.key === null) markConflict();
});
$("sound-button").addEventListener("click", async () => {
  if (
    writeRecord((r) => {
      r.prefs.sound = !r.prefs.sound;
    })
  ) {
    render();
    if (record.prefs.sound) {
      if (await audio.unlock()) audio.play("milestone");
      else
        notify(
          "Sound isn't available right now. You can keep playing silently.",
        );
    }
  }
});
$("how-button").addEventListener("click", showHelp);
$("footer-help").addEventListener("click", showHelp);
$("settings-button").addEventListener("click", showSettings);
$("credits-button").addEventListener("click", showCredits);
$("records-button").addEventListener("click", showRecords);
$("close-dialog").addEventListener("click", closeDialog);
$("dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDialog();
});
$("dialog").addEventListener("click", (e) => {
  if (e.target !== $("dialog")) return;
  const r = $("dialog").getBoundingClientRect();
  if (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  )
    closeDialog();
});
$("dialog").addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeDialog();
    return;
  }
  if (e.key !== "Tab") return;
  const items = [
      ...$("dialog").querySelectorAll(
        "button:not(:disabled),select,input,a[href]",
      ),
    ].filter((x) => !x.hidden && x.getClientRects().length),
    first = items[0],
    last = items.at(-1);
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last?.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first?.focus();
  }
});
const observer =
  typeof ResizeObserver === "function"
    ? new ResizeObserver(() => {
        renderer?.resize();
        dirty = true;
      })
    : null;
observer?.observe(canvas);
window.addEventListener("resize", () => {
  renderer?.resize();
  dirty = true;
});
reduced.addEventListener?.("change", () => {
  dirty = true;
});
function frame(now) {
  const dt = lastTime ? Math.min(0.12, (now - lastTime) / 1000) : 0;
  lastTime = now;
  if (game.phase === "running") {
    applyDuck();
    const events = advance(game, dt);
    for (const event of events) {
      if (event.type === "jump") audio.play("jump");
      if (event.type === "hit") {
        audio.play("hit");
        if (game.lives > 0)
          notify(
            `${game.lives} ${game.lives === 1 ? "heart" : "hearts"} left. A little chance to find your feet.`,
          );
      }
      if (event.type === "milestone") {
        audio.play("milestone");
        $("game-status").textContent =
          `${event.score} points. A little further!`;
      }
      if (event.type === "end") {
        endedAt = now;
        releaseControls();
        saveSnapshot();
        if (event.reason === "finished") audio.play("finish");
        render();
        $("game-status").textContent =
          `Run ended. ${game.score} points, ${Math.floor(game.distance / 10)} metres.`;
      }
    }
    if (game.elapsed - lastSaved >= 5) saveSnapshot();
  }
  if (
    renderer &&
    (dirty || game.phase === "running" || now - lastIdleDraw > 1500)
  ) {
    renderer.draw(game, record.prefs, reduced.matches, now);
    dirty = false;
    lastIdleDraw = now;
  }
  if (now - lastHud > 100) {
    renderHud();
    lastHud = now;
  }
  requestAnimationFrame(frame);
}
if (!renderer) {
  $("canvas-error").hidden = false;
  $("screen-overlay").hidden = true;
  notify("Canvas is unavailable in this browser.");
}
render();
requestAnimationFrame(frame);
const pwa = initPWA({
  onInstallGuide: showInstall,
  beforeUpdate: () => {
    if (game.phase === "running") pause("Your run is saved before updating.");
    else saveSnapshot();
    audio.quiet();
  },
  notify,
});
