/* Word Scramble. Designed & developed by Noorullah Adel, 2026. MIT. */
import {
  createGame,
  startGame,
  pauseGame,
  resumeGame,
  advance,
  pick,
  typeLetter,
  remove,
  clear,
  hint,
  submit,
  next,
  skip,
  result,
  answer,
  shuffled,
} from "./engine.js";
import { WORDS } from "./words.js";
import { $, el, button, initUI } from "./ui.js";
let game = null,
  runId = "",
  conflict = false,
  last = 0,
  order = [],
  shownPuzzle = null,
  pausedText = "";
const id = () =>
  crypto.randomUUID?.() ||
  Date.now().toString(36) + Math.random().toString(36).slice(2);
const ui = initUI({
  kind: "word",
  name: "Word Scramble",
  onPause: pause,
  onHome: home,
  onConflict: () => {
    conflict = true;
    pause("Another tab saved newer scores. Reload before continuing.");
    renderOverlay();
  },
  help: [
    "Tap the loose letter tiles to build the exact word described by the clue. Tap an unlocked answer tile to take it back. Repeated letters have their own tiles.",
    "Use Check word to submit. A clean solve earns 20 points per letter plus 30. Each revealed letter removes 15 from that puzzle’s award, with a minimum of 10 points per solved word.",
    "Reveal letter locks the next correct letter. Clear keeps revealed letters. Shuffle changes only the order of loose tiles. Skip uses one of your five puzzles in Relax or Daily.",
    "Relax has five puzzles and no time limit. Daily uses the same five words for everyone for that UTC date; replay is allowed. Rush has 90 active seconds, including the time spent on the solved screen. Pauses stop the clock.",
    "Physical keyboard: type A–Z, Backspace removes a letter, Enter checks or continues, and Escape pauses. No software keyboard is needed on iPhone.",
    "Play fills the available viewport. Add this game to your Home Screen for app-style iPhone play. The pause panel includes Resume and Back to menu.",
  ],
});
$("word-count").textContent = String(WORDS.length);
$("play-start").addEventListener("click", begin);
function bests() {
  const m = $("mode-choice").value;
  $("home-best").textContent = ui.records.data.best[m].toLocaleString();
  $("category-choice").disabled = m === "daily";
  $("mode-description").textContent = {
    relax: "Five words. Room to think.",
    rush: "90 active seconds. Find your flow.",
    daily: "Five shared words · today in UTC.",
  }[m];
}
for (const id of ["mode-choice", "category-choice"])
  $(id).addEventListener("change", bests);
function begin() {
  if (conflict || ui.records.conflicted) {
    location.reload();
    return;
  }
  ui.screen.enter();
  ui.audio.unlock();
  runId = id();
  game = createGame({
    mode: $("mode-choice").value,
    category: $("category-choice").value,
    seed: runId,
  });
  startGame(game);
  shownPuzzle = null;
  last = performance.now();
  save();
  render();
  $("play-shell").focus({ preventScroll: true });
}
function save() {
  if (!game) return;
  ui.records.save(runId, result(game), game.phase === "ended");
  ui.paintPrefs();
  bests();
}
function pause(text = "Take a breath. Your letters are waiting.") {
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
    $("play-shell").focus({ preventScroll: true });
  }
}
function home(reset = false) {
  if (!reset) save();
  game = null;
  ui.screen.leave();
  $("play-start").focus({ preventScroll: true });
  bests();
}
function act(fn) {
  if (!game || game.phase !== "running" || conflict) return;
  const old = game.round,
    ok = fn(game);
  if (game.round !== old) shownPuzzle = null;
  if (game.phase === "ended") save();
  render();
  return ok;
}
function check() {
  if (game?.phase === "solved") {
    continueGame();
    return;
  }
  if (act(submit)) {
    ui.audio.play("finish");
    save();
    $("live-status").textContent = game.feedback;
  } else if (game) ui.audio.play("hit");
}
function continueGame() {
  if (game?.phase !== "solved") return;
  next(game);
  shownPuzzle = null;
  save();
  render();
}
function render() {
  if (!game) return;
  $("play-mode").textContent = {
    relax: "RELAX · FIVE WORDS",
    rush: "RUSH · 90 SECONDS",
    daily: "DAILY · " + game.date,
  }[game.mode];
  $("score").textContent = game.score;
  $("round-label").textContent =
    game.mode === "rush"
      ? `${game.solved} ${game.solved === 1 ? "word" : "words"} solved`
      : `Puzzle ${Math.min(5, game.round)} / 5`;
  $("clock-label").textContent =
    game.mode === "rush" ? Math.ceil(game.time) + "s" : "NO RUSH";
  $("puzzle-category").textContent = game.current.category.toUpperCase();
  $("clue").textContent = game.current.clue;
  $("feedback").textContent =
    game.feedback || "A little rearranging goes a long way.";
  $("feedback").dataset.success = String(game.phase === "solved");
  if (shownPuzzle !== game.current) {
    order = game.tiles.map((_, i) => i);
    shownPuzzle = game.current;
  }
  const slots = $("answer-tiles");
  slots.replaceChildren();
  for (let i = 0; i < game.tiles.length; i++) {
    const selected = game.selected[i],
      b = button(
        selected === undefined ? "" : game.tiles[selected],
        "answer-tile",
        () => act((g) => remove(g, i)),
      );
    b.setAttribute(
      "aria-label",
      selected === undefined
        ? `Empty answer position ${i + 1}`
        : i < game.locked
          ? `Revealed ${game.tiles[selected]}, position ${i + 1}`
          : `Remove ${game.tiles[selected]} at position ${i + 1}`,
    );
    b.disabled =
      selected === undefined || i < game.locked || game.phase !== "running";
    if (i < game.locked) b.classList.add("locked");
    slots.append(b);
  }
  const bank = $("letter-tiles");
  bank.replaceChildren();
  for (const i of order) {
    const b = button(game.tiles[i], "letter-tile", () =>
      act((g) => pick(g, i)),
    );
    b.dataset.tile = String(i);
    b.setAttribute("aria-label", `Choose ${game.tiles[i]}, tile ${i + 1}`);
    b.disabled = game.selected.includes(i) || game.phase !== "running";
    bank.append(b);
  }
  for (const key of [
    "clear-button",
    "shuffle-button",
    "hint-button",
    "skip-button",
  ])
    $(key).disabled = game.phase !== "running" || conflict;
  $("check-button").textContent =
    game.phase === "solved"
      ? game.mode !== "rush" && game.round >= 5
        ? "See my results"
        : "Next word →"
      : "Check word →";
  $("check-button").disabled =
    !["running", "solved"].includes(game.phase) || conflict;
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
      ? "LETTERS, UNTANGLED."
      : "A LITTLE BREATHER";
  $("overlay-title").textContent = conflict
    ? "A fresh record awaits."
    : game.phase === "ended"
      ? `${game.solved} ${game.solved === 1 ? "word" : "words"}. Well played.`
      : "Room to think.";
  $("overlay-copy").textContent = conflict
    ? "Reload to use the newest records from your other tab."
    : game.phase === "ended"
      ? `${game.score} points · ${game.hints} revealed letters · ${game.skipped} skipped. ${game.mode === "daily" ? "Daily " + game.date + " · replay any time." : "Fancy another little round?"}`
      : pausedText;
  $("overlay-primary").textContent = conflict
    ? "Reload scores"
    : game.phase === "ended"
      ? "Play again"
      : "Resume game";
  $("overlay-secondary").textContent = "Back to menu";
  if (wasHidden) $("overlay-primary").focus({ preventScroll: true });
}
$("overlay-primary").addEventListener("click", () =>
  conflict ? location.reload() : game.phase === "ended" ? begin() : resume(),
);
$("overlay-secondary").addEventListener("click", () => home());
$("pause-button").addEventListener("click", () => pause());
$("check-button").addEventListener("click", check);
$("clear-button").addEventListener("click", () => act(clear));
$("hint-button").addEventListener("click", () => act(hint));
$("skip-button").addEventListener("click", () => {
  const word = game?.current.word;
  if (act(skip)) {
    ui.toast(
      `The word was ${word}.${game.phase === "ended" ? " Round complete." : " A fresh puzzle awaits."}`,
    );
  }
});
$("shuffle-button").addEventListener("click", () => {
  if (game?.phase !== "running") return;
  order = shuffled(order, Math.random);
  render();
});
window.addEventListener("keydown", (e) => {
  if (
    !ui.screen.active ||
    $("dialog").hasAttribute("open") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  if (e.repeat) return;
  if (e.code === "Escape") {
    e.preventDefault();
    if (game.phase === "paused") resume();
    else pause();
    return;
  }
  if (e.target.closest?.("button,a,input,select,textarea")) return;
  if (game.phase === "paused" || game.phase === "ended") return;
  if (e.code === "Enter") {
    e.preventDefault();
    check();
  } else if (e.code === "Backspace") {
    e.preventDefault();
    act(remove);
  } else if (/^[a-z]$/i.test(e.key)) {
    e.preventDefault();
    act((g) => typeLetter(g, e.key));
  }
});
window.addEventListener("pagehide", save);
function frame(now) {
  if (game && ui.screen.active) {
    if (advance(game, last ? Math.max(0, (now - last) / 1000) : 0)) {
      save();
      render();
    }
    if (game.mode === "rush")
      $("clock-label").textContent = Math.ceil(game.time) + "s";
  }
  last = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
bests();
