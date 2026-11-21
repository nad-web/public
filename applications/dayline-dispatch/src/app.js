/* Dayline Dispatch · Developed and designed by Noorullah Adel, 2026 · MIT. */
import { CITIES, LINES, MODES } from "./cities.js";
import {
  TICKS,
  SHIFT,
  MAX_STOPS,
  createGame,
  start,
  pause,
  endShift,
  tick,
  editLine,
  greenWave,
  score,
} from "./engine.js";
import { newBook, finishRecord, validateBook } from "./records.js";
import { createStorage } from "./storage.js";
import { createAudio } from "./audio.js";
import { toggleFullscreen } from "./fullscreen.js";
import { createMap } from "./map.js";
import { makePanels } from "./panels.js";
import { initPWA } from "./pwa.js";

const $ = (id) => document.getElementById(id);
const tell = (id, value) => {
  const node = $(id),
    v = String(value);
  if (node.textContent !== v) node.textContent = v;
};
const icon = (id, type) =>
  $(id)
    .querySelector("use")
    .setAttribute("href", "#ic-" + type);
const label = (id, value) => {
  const node = $(id).querySelector("span");
  if (node.textContent !== value) node.textContent = value;
};
const lines = Array.from(document.querySelectorAll("[data-line]"));
const backdrop = $("shade"),
  background = [
    document.querySelector(".mast"),
    $("game"),
    document.querySelector(".foot"),
  ];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const clock = (secs) =>
  Math.floor(secs / 60)
    .toString()
    .padStart(2, "0") +
  ":" +
  (secs % 60).toString().padStart(2, "0");
function randomSeed() {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  } catch {
    return (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
  }
}
let backend;
try {
  backend = window.localStorage;
} catch {}
const storage = createStorage(
  backend,
  "dayline-dispatch:v1:" + new URL("../", import.meta.url).pathname,
  validateBook,
);
const saved = storage.load();
let book = saved.state || newBook(),
  storageIssue = saved.error || "";
let s = book.active || createGame({ seed: randomSeed() });
pause(s);
let line = 1,
  selected = 3,
  draft = null,
  editWasRunning = false,
  dialogWasRunning = false,
  lastFocus = null;
let frameId = 0,
  lastTime = 0,
  acc = 0,
  toastTimer = 0,
  lastBell = -100,
  panels;
const soundscape = createAudio();
soundscape.setEnabled(book.sound);
const map = createMap({
  onStop: (id) => pick(id),
  onSweep: (id) => pick(id, true),
});

function toast(message) {
  const node = $("alert");
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.hidden = true;
  }, 3400);
}
function conflict() {
  if (storageIssue === "conflict") return;
  storageIssue = "conflict";
  pause(s);
  editWasRunning = false;
  dialogWasRunning = false;
  if (panels) panels.conflict();
  render();
}
function save(replaceBroken = false) {
  if (storageIssue === "conflict") return;
  book.active = s;
  const r = storage.write(book, { replaceBroken });
  if (r.ok) {
    storageIssue = "";
    return;
  }
  if (r.reason === "conflict") {
    conflict();
    return;
  }
  if (r.reason !== storageIssue)
    toast(
      r.reason === "invalid"
        ? "Saved data needs attention. Open Settings to review it."
        : "Saving is unavailable. This shift will last for this session.",
    );
  storageIssue = r.reason;
}
function reload() {
  const latest = storage.load();
  book = latest.state || newBook();
  storageIssue = latest.error || "";
  s = book.active || createGame({ seed: randomSeed() });
  pause(s);
  selected = 3;
  line = 1;
  draft = null;
  editWasRunning = false;
  dialogWasRunning = false;
  lastBell = -100;
  soundscape.setEnabled(book.sound);
  close(false);
  render();
  toast("Latest shift loaded.");
}
function resetClock() {
  lastTime = 0;
  acc = 0;
}
function open(title, install = false) {
  const first = backdrop.hidden;
  if (first) {
    lastFocus = document.activeElement;
    dialogWasRunning = pause(s);
    resetClock();
    backdrop.hidden = false;
    background.forEach((n) => {
      n.inert = true;
      n.setAttribute("aria-hidden", "true");
    });
    $("app").classList.add("locked");
  }
  tell("dialog-title", title);
  $("install-panel").hidden = !install;
  document.querySelector(".dialog").scrollTop = 0;
  $("close").focus({ preventScroll: true });
  if (first && dialogWasRunning) save();
  render();
}
function close(resume = true) {
  if (backdrop.hidden) return;
  backdrop.hidden = true;
  background.forEach((n) => {
    n.inert = false;
    n.removeAttribute("aria-hidden");
  });
  $("app").classList.remove("locked");
  if (
    resume &&
    dialogWasRunning &&
    !document.hidden &&
    storageIssue !== "conflict"
  )
    start(s);
  dialogWasRunning = false;
  resetClock();
  render();
  if (
    lastFocus?.isConnected &&
    !lastFocus.disabled &&
    lastFocus.getClientRects().length
  )
    lastFocus.focus({ preventScroll: true });
  else $("run").focus({ preventScroll: true });
}
function newShift(options) {
  draft = null;
  editWasRunning = false;
  dialogWasRunning = false;
  s = createGame(options);
  selected = 3;
  line = 1;
  lastBell = -100;
  resetClock();
  close(false);
  render();
  save();
}
function begin(mode, city, date) {
  newShift({ mode, city, date, seed: randomSeed() });
}
function retry() {
  newShift({ mode: s.mode, city: s.city, date: s.date, seed: s.seed });
}
function finish() {
  endShift(s);
  finishRecord(book, s);
  editWasRunning = false;
  dialogWasRunning = false;
  draft = null;
  save();
  render();
  if (storageIssue !== "conflict") panels.receipt();
  soundscape.play("finish");
}
function toggleSound() {
  book.sound = !book.sound;
  soundscape.setEnabled(book.sound);
  if (book.sound)
    soundscape.unlock().then((ok) => {
      if (ok) soundscape.play("depart");
      else toast("Audio is unavailable on this device.");
    });
  render();
  save();
}
panels = makePanels({
  get: () => ({ s, book, draft, storageIssue }),
  open,
  close,
  pick,
  begin,
  retry,
  finish,
  sound: toggleSound,
  focus: async () => {
    const ok = await toggleFullscreen();
    if (ok) close();
    else panels.install();
  },
  repair: () => {
    save(true);
    if (!storageIssue) {
      panels.settings();
      toast("Local save repaired.");
    }
  },
  reload,
});

function stops() {
  return CITIES[s.city].stations;
}
function queueDetail(id) {
  const q = s.queues[id],
    assigned = s.routes
      .map((r, i) => (r.includes(id) ? LINES[i].code : ""))
      .filter(Boolean);
  const serving = assigned.length
    ? "Line " + assigned.join(" + ")
    : "Unconnected";
  if (!q.length) return serving + " · No one waiting";
  const dest = new Map();
  for (const rider of q) dest.set(rider.dest, (dest.get(rider.dest) || 0) + 1);
  const ordered = [...dest.entries()].sort(
    (a, b) => b[1] - a[1] || a[0] - b[0],
  );
  const names = ordered
    .slice(0, 2)
    .map(([i, n]) => stops()[i].name + (n > 1 ? " ×" + n : ""))
    .join(", ");
  return (
    serving +
    " · " +
    q.length +
    " waiting for " +
    names +
    (ordered.length > 2 ? " +" + (ordered.length - 2) + " more" : "")
  );
}
function pick(id, sweep = false) {
  if (!Number.isInteger(id) || id < 0 || id >= s.open) return;
  selected = id;
  if (draft) {
    if (!draft.includes(id) && draft.length < MAX_STOPS) draft.push(id);
    else if (!sweep)
      toast(
        draft.includes(id)
          ? "Already on this line. Undo removes the last stop."
          : "A line can serve five stops. Use another line or undo.",
      );
  }
  render();
}
function edit() {
  if (s.phase === "done" || draft) return;
  editWasRunning = pause(s);
  resetClock();
  draft = [...s.routes[line]];
  render();
  if (editWasRunning) save();
}
function leaveEdit(commit) {
  if (!draft) return;
  if (commit && !editLine(s, line, draft)) return;
  if (commit) {
    toast(
      draft.length
        ? "Line " + LINES[line].code + " in service."
        : "Line " + LINES[line].code + " suspended.",
    );
  }
  draft = null;
  if (editWasRunning && !document.hidden && storageIssue !== "conflict")
    start(s);
  editWasRunning = false;
  resetClock();
  render();
  if (commit) save();
  $("edit-line").focus({ preventScroll: true });
}
function chooseLine(i) {
  if (draft) return;
  line = i;
  render();
}
function run() {
  if (draft || !backdrop.hidden) return;
  if (s.phase === "done") {
    panels.receipt();
    return;
  }
  if (s.phase === "running") {
    pause(s);
    soundscape.quiet();
  } else {
    if (storageIssue === "conflict") {
      panels.conflict();
      return;
    }
    start(s);
    soundscape.unlock().then((ok) => {
      if (ok) soundscape.play("depart");
    });
  }
  resetClock();
  render();
  save();
}
function wave() {
  if (greenWave(s)) {
    soundscape.play("wave");
    toast("Green Wave · faster trains for eight seconds.");
    render();
    save();
  }
}
function drawDispatch() {
  const o = s.order;
  if (o) {
    tell(
      "call-name",
      (o.won ? "Call complete · " : "Deliver to ") + stops()[o.target].name,
    );
    tell(
      "call-meta",
      o.won
        ? "Bonus earned. Fleet capacity is now " +
            Math.min(8, 5 + s.ordersWon) +
            " per train."
        : "Three deliveries earn 50 points and a seat.",
    );
    tell(
      "call-count",
      o.count +
        "/" +
        o.goal +
        (o.won
          ? ""
          : " · " + Math.max(0, Math.ceil((o.due - s.clock) / TICKS)) + "s"),
    );
  } else {
    const missing = stops()
      .slice(0, s.open)
      .findIndex((_, i) => !s.routes.some((r) => r.includes(i)));
    tell(
      "call-name",
      missing >= 0 ? "Connect " + stops()[missing].name : "All stops connected",
    );
    tell(
      "call-meta",
      missing >= 0
        ? "Give this station a route into town."
        : "Inspect a queue to plan the next change.",
    );
    tell("call-count", s.phase === "ready" ? "" : s.open + " stops");
  }
}
function render() {
  const names = stops(),
    def = LINES[line],
    route = s.routes[line],
    editing = draft !== null;
  tell("city", CITIES[s.city].name);
  tell("mode", MODES[s.mode]);
  tell("time-label", s.mode === "easy" ? "On duty" : "Time left");
  tell(
    "time",
    clock(
      s.mode === "easy"
        ? Math.floor(s.clock / TICKS)
        : Math.max(0, Math.ceil((SHIFT - s.clock) / TICKS)),
    ),
  );
  $("clock-fill").style.width =
    (s.mode === "easy" ? 100 : (100 * (SHIFT - s.clock)) / SHIFT) + "%";
  tell("served", s.served);
  tell("score", score(s));
  tell(
    "phase",
    editing
      ? "Planning"
      : { ready: "Ready", running: "Live", paused: "Paused", done: "Finished" }[
          s.phase
        ],
  );
  $("phase").dataset.phase = s.phase;
  tell("stop-title", names[selected].name);
  tell("stop-brief", queueDetail(selected));
  tell("line-total", s.routes.filter((r) => r.length).length + " / 3 active");
  lines.forEach((b, i) => {
    b.setAttribute("aria-pressed", String(i === line));
    b.disabled = editing && i !== line;
    const count = s.routes[i].length,
      info = count ? count + " stops" : "Unassigned";
    b.querySelector("small").textContent = info;
    b.setAttribute(
      "aria-label",
      "Line " + LINES[i].code + ", " + LINES[i].name + ", " + info,
    );
  });
  $("line-normal").hidden = editing;
  $("line-editor").hidden = !editing;
  $("app").classList.toggle("edit-mode", editing);
  $("map").classList.toggle("editing", editing);
  $("map").style.setProperty("--active-line", def.color);
  $("map").setAttribute(
    "aria-label",
    editing
      ? "Choose stations in travel order for line " + def.code
      : "Transit map. Select a station to see its passengers.",
  );
  if (editing) {
    tell(
      "draft-title",
      draft.length
        ? draft.map((i) => names[i].name).join(" → ")
        : "Tap two to five stops in travel order.",
    );
    $("draft-undo").disabled = !draft.length;
    $("draft-clear").disabled = !draft.length;
    $("draft-save").disabled =
      draft.length === 1 || (!draft.length && !route.length);
    tell(
      "draft-save",
      !draft.length && route.length ? "Suspend line" : "Save line",
    );
  } else {
    tell(
      "route-desc",
      route.length
        ? route.map((i) => names[i].name).join(" → ")
        : "Join an unconnected station to a working line.",
    );
    label("edit-line", (route.length ? "Edit line " : "Draw line ") + def.code);
    $("edit-line").disabled = s.phase === "done";
  }
  drawDispatch();
  label("audio", book.sound ? "Sound on" : "Sound off");
  icon("audio", book.sound ? "sound" : "mute");
  $("audio").setAttribute("aria-pressed", String(book.sound));
  $("audio").setAttribute("aria-label", book.sound ? "Sound on" : "Sound off");
  $("audio").title = book.sound ? "Sound on" : "Sound off";
  label(
    "run",
    {
      ready: "Start shift",
      running: "Pause",
      paused: "Resume",
      done: "View ticket",
    }[s.phase],
  );
  icon(
    "run",
    s.phase === "running" ? "pause" : s.phase === "done" ? "ticket" : "play",
  );
  $("run").disabled = editing;
  $("wave").disabled = s.phase !== "running" || s.clock < s.boostReady;
  tell(
    "wave-count",
    s.clock < s.boostUntil
      ? "Active"
      : s.clock < s.boostReady
        ? Math.ceil((s.boostReady - s.clock) / TICKS) + "s"
        : "",
  );
  map.render(s, selected, line, draft, 0, reduced.matches);
  if (s.phase === "running" && !document.hidden && !frameId)
    frameId = requestAnimationFrame(animate);
}
function animate(now) {
  frameId = 0;
  if (s.phase !== "running" || document.hidden) {
    resetClock();
    return;
  }
  if (lastTime) acc += Math.min(500, now - lastTime);
  lastTime = now;
  let changed = false;
  while (acc >= 1000 / TICKS && s.phase === "running") {
    acc -= 1000 / TICKS;
    const events = tick(s);
    changed = true;
    for (const e of events) {
      if (e.kind === "opening") {
        toast(stops()[e.stop].name + " just opened.");
        soundscape.play("call");
      }
      if (e.kind === "order") {
        toast("Dispatch call · three riders to " + stops()[e.stop].name);
        soundscape.play("call");
      }
      if (e.kind === "order-won") {
        toast("Dispatch call complete! +50 points.");
        soundscape.play("wave");
      }
      if (e.kind === "delivered" && s.clock - lastBell >= 8) {
        soundscape.play("arrival");
        lastBell = s.clock;
      }
      if (e.kind === "finish") {
        finish();
        return;
      }
    }
    if (s.clock % (TICKS * 4) === 0) save();
  }
  if (changed) render();
  if (!reduced.matches) map.move(s, (acc * TICKS) / 1000, false);
  if (s.phase === "running" && !frameId)
    frameId = requestAnimationFrame(animate);
}
function backgroundPause() {
  const wasLive = pause(s);
  editWasRunning = false;
  dialogWasRunning = false;
  resetClock();
  if (wasLive) {
    soundscape.suspend();
    render();
    save();
  }
}
$("audio").onclick = toggleSound;
$("help").onclick = panels.help;
$("settings").onclick = panels.settings;
$("dispatch").onclick = panels.dispatch;
$("stop-list").onclick = panels.stationList;
$("choose-shift").onclick = panels.choose;
$("close").onclick = () => close();
backdrop.onclick = (e) => {
  if (e.target === backdrop) close();
};
$("run").onclick = run;
$("wave").onclick = wave;
$("edit-line").onclick = edit;
$("draft-save").onclick = () => leaveEdit(true);
$("draft-cancel").onclick = () => leaveEdit(false);
$("draft-clear").onclick = () => {
  draft = [];
  render();
};
$("draft-undo").onclick = () => {
  draft.pop();
  render();
};
lines.forEach((b, i) => {
  b.onclick = () => chooseLine(i);
});
document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (!backdrop.hidden) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const focusable = [
        ...backdrop.querySelectorAll("button:not([disabled]),a[href]"),
      ].filter((b) => b.getClientRects().length);
      const target = document.activeElement;
      if (e.shiftKey && target === focusable[0]) {
        e.preventDefault();
        focusable[focusable.length - 1]?.focus();
      } else if (!e.shiftKey && target === focusable[focusable.length - 1]) {
        e.preventDefault();
        focusable[0]?.focus();
      }
    }
    return;
  }
  if (e.repeat) return;
  if (e.key === "Escape" && draft) {
    e.preventDefault();
    leaveEdit(false);
  }
  if (["1", "2", "3"].includes(e.key)) chooseLine(Number(e.key) - 1);
  if (e.key.toLowerCase() === "e") edit();
  if (e.key.toLowerCase() === "g") wave();
  if (
    e.code === "Space" &&
    !e.target.closest("button,a,input,select,textarea")
  ) {
    e.preventDefault();
    run();
  }
});
window.addEventListener("storage", (e) => {
  if (
    (e.key === storage.key || e.key === null) &&
    backend &&
    (e.key === null || e.newValue !== storage.raw)
  )
    conflict();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) backgroundPause();
});
window.addEventListener("pagehide", backgroundPause);
window.addEventListener("pageshow", () => {
  resetClock();
  render();
});
render();
if (saved.error)
  toast(
    saved.error === "invalid"
      ? "Local save could not be read. Settings has a repair option."
      : "Saving is unavailable in this browser session.",
  );
initPWA({
  onInstallGuide: panels.install,
  beforeUpdate: backgroundPause,
  notify: toast,
});
