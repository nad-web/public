/* Stack Tower. Designed & developed by Noorullah Adel, 2026. MIT. */
import {
  createGame,
  startGame,
  pauseGame,
  resumeGame,
  advance,
  drop,
  result,
} from "./engine.js";
import { createRenderer } from "./render.js";
import { $, initUI } from "./ui.js";
let lastEffects;
let game = null,
  renderer = null,
  runId = "",
  conflict = false,
  last = 0,
  feedbackUntil = 0,
  pausedText = "",
  dirty = true;
const ui = initUI({
  kind: "stack",
  name: "Stack Tower",
  onPause: pause,
  onHome: home,
  onConflict: () => {
    conflict = true;
    pause("Another tab changed your records. Reload to continue.");
    renderOverlay();
  },
  onResize: () => {
    renderer?.resize();
    dirty = true;
  },
  help: [
    "Tap DROP BLOCK or the tower canvas when the moving block lines up with the one below. Space or Enter also drops it. Each press places one block.",
    "Overhanging pieces fall away. The remaining overlap becomes the next block’s footprint. A complete miss, or an overlap under one world unit, ends the run.",
    "A perfect alignment snaps to the block beneath and keeps its full size. Each block earns 10 points; perfect adds 5, with another 10 for every third consecutive perfect.",
    "Classic gets faster as your tower grows. Chill moves more slowly and has a wider perfect-alignment tolerance. Best height is saved separately for each mode.",
    "P or Escape pauses. Leaving the tab, opening a panel or exiting native fullscreen pauses the game. Resume explicitly to continue.",
    "Play fills the available viewport. On iPhone, install from Safari’s Share → Add to Home Screen, enable Open as Web App, and launch that icon for app-style play.",
  ],
});
renderer = createRenderer($("tower-canvas"));
if (!renderer) {
  $("play-start").disabled = true;
  $("canvas-warning").hidden = false;
}
function bests() {
  $("home-best").textContent = ui.records.data.best[$("mode-choice").value];
  $("mode-description").textContent =
    $("mode-choice").value === "classic"
      ? "Find the rhythm. Keep the edges."
      : "Slower blocks. More room to line it up.";
}
$("mode-choice").addEventListener("change", bests);
$("play-start").addEventListener("click", begin);
function begin() {
  if (conflict || ui.records.conflicted) {
    location.reload();
    return;
  }
  if (!renderer) return;
  ui.screen.enter();
  ui.audio.unlock();
  runId =
    crypto.randomUUID?.() ||
    Date.now().toString(36) + Math.random().toString(36).slice(2);
  game = createGame({
    mode: $("mode-choice").value,
    seed: Math.floor(Math.random() * 2 ** 32),
  });
  startGame(game);
  last = performance.now();
  renderer.resize();
  save();
  render();
  $("tower-canvas").focus({ preventScroll: true });
}
function save() {
  if (!game) return;
  ui.records.save(runId, result(game), game.phase === "ended");
  ui.paintPrefs();
  bests();
}
function pause(text = "Keep your balance. Your tower is waiting.") {
  if (!game || !ui?.screen.active) return;
  if (pauseGame(game)) {
    pausedText = text;
    save();
    ui.audio.quiet();
    renderOverlay();
  } else if (game.phase === "paused") {
    pausedText = text;
    renderOverlay();
  }
}
function resume() {
  if (conflict) {
    location.reload();
    return;
  }
  if (resumeGame(game)) {
    last = performance.now();
    ui.audio.unlock();
    render();
    $("tower-canvas").focus({ preventScroll: true });
  }
}
function home(reset = false) {
  if (!reset) save();
  game = null;
  ui.screen.leave();
  $("play-start").focus({ preventScroll: true });
  bests();
}
function place() {
  if (
    !game ||
    game.phase !== "running" ||
    conflict ||
    $("dialog").hasAttribute("open")
  )
    return;
  const event = drop(game);
  if (!event) return;
  feedbackUntil = performance.now() + 900;
  $("placement-feedback").textContent =
    event.type === "perfect"
      ? `PERFECT${event.streak > 1 ? " ×" + event.streak : ""} +${event.points}`
      : event.type === "miss"
        ? "A little off balance."
        : `NICE CATCH +${event.points}`;
  ui.audio.play(
    event.type === "perfect"
      ? "milestone"
      : event.type === "miss"
        ? "hit"
        : "jump",
  );
  save();
  render();
}
function render() {
  if (!game) return;
  $("play-mode").textContent = game.mode.toUpperCase();
  $("height-score").textContent = game.height;
  $("run-score").textContent = game.score;
  $("best-height").textContent = ui.records.data.best[game.mode];
  $("streak").textContent = game.streak;
  $("pause-button").disabled = game.phase !== "running";
  $("drop-button").disabled = game.phase !== "running" || conflict;
  dirty = true;
  renderOverlay();
}
function renderOverlay() {
  if (!game) return;
  const overlay = $("game-overlay"),
    wasHidden = overlay.hidden;
  overlay.hidden = !conflict && !["paused", "ended"].includes(game.phase);
  if (overlay.hidden) return;
  $("overlay-eyebrow").textContent = conflict
    ? "RECORDS CHANGED"
    : game.phase === "ended"
      ? "A LITTLE HIGHER NEXT TIME."
      : "STEADY DOES IT";
  $("overlay-title").textContent = conflict
    ? "A fresh record awaits."
    : game.phase === "ended"
      ? `${game.height} ${game.height === 1 ? "block" : "blocks"} of brilliance.`
      : "Take a breather.";
  $("overlay-copy").textContent = conflict
    ? "Reload to use your other tab’s latest records."
    : game.phase === "ended"
      ? `${game.score} points · ${game.perfect} perfect drops · best streak ${game.bestStreak}.`
      : pausedText;
  $("overlay-primary").textContent = conflict
    ? "Reload scores"
    : game.phase === "ended"
      ? "Build again"
      : "Resume game";
  if (wasHidden) $("overlay-primary").focus({ preventScroll: true });
}
$("overlay-primary").addEventListener("click", () =>
  conflict ? location.reload() : game.phase === "ended" ? begin() : resume(),
);
$("overlay-secondary").addEventListener("click", () => home());
$("pause-button").addEventListener("click", () => pause());
for (const id of ["drop-button", "tower-canvas"]) {
  $(id).addEventListener("pointerdown", (e) => {
    if (e.button === 0) {
      e.preventDefault();
      place();
    }
  });
  $(id).addEventListener("click", (e) => {
    if (e.detail === 0) place();
  });
  $(id).addEventListener("contextmenu", (e) => e.preventDefault());
  $(id).addEventListener("keydown", (e) => {
    if (e.repeat) e.preventDefault();
  });
}
window.addEventListener("keydown", (e) => {
  if (
    !ui.screen.active ||
    $("dialog").hasAttribute("open") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    e.repeat
  )
    return;
  if (["KeyP", "Escape"].includes(e.code)) {
    e.preventDefault();
    if (game.phase === "paused") resume();
    else pause();
  } else if (
    !e.target.closest?.("button,a,input,select,textarea") &&
    ["Space", "Enter"].includes(e.code)
  ) {
    e.preventDefault();
    place();
  }
});
window.addEventListener("pagehide", save);
function frame(now) {
  const dt = last ? Math.min(0.12, Math.max(0, (now - last) / 1000)) : 0;
  last = now;
  if (game && ui.screen.active) {
    advance(game, dt);
    const effects = ui.records.data.prefs.effects && !ui.reduced.matches;
    if (
      game.phase === "running" ||
      (game.phase === "ended" && game.falling.length) ||
      dirty ||
      effects !== lastEffects
    )
      renderer?.draw(game, effects, dt);
    lastEffects = effects;
    $("placement-feedback").hidden = now > feedbackUntil;
    dirty = false;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
bests();
