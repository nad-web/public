/* Boredom Roulette. Designed & developed by Noorullah Adel, 2026. MIT. */
import { CHALLENGES } from "./challenges.js";
import {
  CATEGORIES,
  CATEGORY_IDS,
  initialState,
  validateState,
  validateChallenge,
  allChallenges,
  eligible,
  chooseChallenge,
  offerChallenge,
  remaining,
  startTimer,
  pauseTimer,
  settleTimer,
  completeChallenge,
  localDay,
  streakToday,
  badges,
  wheelTarget,
} from "./engine.js";
import { createStorage } from "./storage.js";
import { createAudio } from "./audio.js";
import { initPWA } from "./pwa.js";
import { challengeText, challengeSVG } from "./share.js";
const $ = (id) => document.getElementById(id),
  audio = createAudio(),
  reduced = matchMedia("(prefers-reduced-motion: reduce)"),
  rootURL = new URL("../", import.meta.url);
let backend;
try {
  backend = localStorage;
} catch {}
const records = createStorage(
  backend,
  "noorullah:boredom-roulette:v1:" + rootURL.pathname,
  (s) => validateState(s, CHALLENGES),
);
const loaded = records.load();
let state = loaded.state || initialState(),
  spinning = false,
  spinVersion = 0,
  spinTimer,
  angle = 0,
  toastTimer,
  confirmationPending = false,
  previousFocus,
  dialogCloseAction,
  lastRenderedDay = "";
const cat = (id) => CATEGORIES.find((c) => c.id === id),
  cardNow = () =>
    allChallenges(state, CHALLENGES).find((c) => c.id === state.active?.id);
function element(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}
function button(text, className, fn) {
  const b = element("button", className, text);
  b.type = "button";
  if (fn) b.addEventListener("click", fn);
  return b;
}
function notify(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 4400);
}
function storageMessage(reason) {
  $("storage-status").textContent =
    reason === "invalid"
      ? "The previous saved record could not be read. Play this visit, or export the old record in Settings before importing or resetting."
      : reason
        ? "Saving is unavailable in this browser session. You can still play; download a backup in Settings to keep your progress."
        : "Progress stays in this browser. No account, tracking or cloud sync.";
}
storageMessage(loaded.error);
function cancelSpin() {
  clearTimeout(spinTimer);
  spinVersion++;
  spinning = false;
  $("wheel-art").style.transition = "none";
}
function adoptLatest() {
  const fresh = records.load();
  cancelSpin();
  if (fresh.state) state = fresh.state;
  else if (!fresh.error) state = initialState();
  storageMessage(fresh.error);
  render();
  notify(
    "Another tab changed this game. The latest saved record is loaded; please try your action again.",
  );
}
function change(fn, { renderNow = true, replaceBroken = false } = {}) {
  const next = JSON.parse(JSON.stringify(state));
  if (fn(next) === false) return false;
  const result = records.write(next, { replaceBroken });
  if (!result.ok && result.reason === "conflict") {
    adoptLatest();
    return false;
  }
  state = next;
  storageMessage(result.ok ? null : result.reason);
  if (renderNow) render();
  return true;
}
function random() {
  try {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] / 4294967296;
  } catch {
    return Math.random();
  }
}
function token() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }
}
const downloadURLs = new WeakMap();
function prepareDownload(link, name, content, type) {
  const blob = new Blob([content], { type }),
    url = URL.createObjectURL(blob),
    previous = downloadURLs.get(link);
  link.href = url;
  link.download = name;
  link.dataset.download = "ready";
  downloadURLs.set(link, url);
  if (previous) setTimeout(() => URL.revokeObjectURL(previous), 30000);
}
function renderWheel() {
  const ns = "http://www.w3.org/2000/svg",
    group = $("wheel-sectors"),
    cards = eligible(allChallenges(state, CHALLENGES), state.settings),
    available = new Set(cards.map((c) => c.category));
  group.replaceChildren();
  const make = (tag, attrs) => {
    const e = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs))
      e.setAttribute(key, String(value));
    return e;
  };
  const point = (degrees, r) => [
    220 + r * Math.cos(((degrees - 90) * Math.PI) / 180),
    220 + r * Math.sin(((degrees - 90) * Math.PI) / 180),
  ];
  group.append(
    make("circle", {
      cx: 220,
      cy: 220,
      r: 214,
      fill: "#fffefa",
      stroke: "#29243b",
      "stroke-width": 1,
    }),
  );
  CATEGORIES.forEach((c, i) => {
    const start = point(i * 60, 202),
      end = point((i + 1) * 60, 202),
      p = point(i * 60 + 30, 145),
      enabled = available.has(c.id);
    group.append(
      make("path", {
        d: `M220 220 L${start[0]} ${start[1]} A202 202 0 0 1 ${end[0]} ${end[1]} Z`,
        fill: enabled ? c.color : "#e2e0dc",
        stroke: "#fffefa",
        "stroke-width": 3,
        opacity: enabled ? 1 : 0.45,
      }),
    );
    const label = make("text", {
      x: p[0],
      y: p[1],
      fill: "#29243b",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-family": "Arial, sans-serif",
      "font-size": 15,
      "font-weight": 700,
      transform: `rotate(${i * 60 + 30} ${p[0]} ${p[1]})`,
    });
    label.textContent = c.name;
    group.append(label);
    const starPoint = point(i * 60 + 30, 107),
      mark = make("text", {
        x: starPoint[0],
        y: starPoint[1],
        fill: "#29243b",
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": 27,
        transform: `rotate(${i * 60 + 30} ${starPoint[0]} ${starPoint[1]})`,
      });
    mark.textContent = c.mark;
    group.append(mark);
  });
  for (let i = 0; i < 48; i++) {
    const p = point(i * 7.5, 208);
    group.append(
      make("circle", { cx: p[0], cy: p[1], r: 1.1, fill: "#80798b" }),
    );
  }
  group.append(make("circle", { cx: 220, cy: 220, r: 69, fill: "#fffefa" }));
  $("spin-button").disabled = spinning || cards.length === 0;
  $("spin-button").querySelector("strong").textContent = spinning
    ? "…"
    : "SPIN";
  $("spin-button").setAttribute(
    "aria-label",
    spinning ? "Spinning the wheel" : "Spin for a new challenge",
  );
  $("wheel-status").textContent = spinning
    ? "A little possibility is on its way…"
    : cards.length
      ? `${cards.length} ${cards.length === 1 ? "idea" : "ideas"} match your moment. Let chance choose.`
      : "No ideas match these filters. Try a longer time or more categories.";
  $("reset-filters-button").hidden = cards.length > 0;
  $("reset-filters-button").disabled = spinning;
}
function renderFilters() {
  for (const id of ["minutes", "mode", "energy", "place"]) {
    $(id + "-filter").value = String(state.settings[id]);
    $(id + "-filter").disabled = spinning;
  }
  for (const b of $("category-chips").children) {
    b.disabled = spinning;
    b.setAttribute(
      "aria-pressed",
      String(state.settings.categories.includes(b.dataset.category)),
    );
  }
}
function renderChallenge() {
  const card = cardNow(),
    a = state.active,
    show = Boolean(card) && !spinning;
  $("empty-card").hidden = show;
  $("challenge-card").hidden = !show;
  if (!show) {
    if (spinning)
      $("empty-title").textContent = "A tiny plot twist is on its way…";
    else
      $("empty-title").replaceChildren(
        document.createTextNode("A little less “meh”."),
        element("br"),
        document.createTextNode("A little more "),
        element("em", "", "“why not?”"),
      );
    return;
  }
  const category = cat(card.category),
    done = a.phase === "done",
    active = ["running", "paused", "expired"].includes(a.phase);
  $("challenge-card").style.setProperty("--category", category.color);
  $("challenge-category").textContent = category.mark + " " + category.name;
  $("challenge-number").textContent = card.custom
    ? "FROM YOUR OWN LITTLE IDEA BOOK"
    : "AN ORIGINAL LITTLE ADVENTURE";
  $("challenge-title").textContent = card.title;
  const cardLink = $("download-card");
  if (cardLink.dataset.card !== card.id) {
    prepareDownload(
      cardLink,
      "boredom-roulette-" + card.id + ".svg",
      challengeSVG(card),
      "image/svg+xml;charset=utf-8",
    );
    cardLink.dataset.card = card.id;
  }
  $("favorite-button").textContent = state.favorites.includes(card.id)
    ? "★"
    : "☆";
  $("favorite-button").setAttribute(
    "aria-pressed",
    String(state.favorites.includes(card.id)),
  );
  $("favorite-button").setAttribute(
    "aria-label",
    state.favorites.includes(card.id)
      ? "Remove challenge from your pocket"
      : "Save challenge to your pocket",
  );
  const facts = $("challenge-facts");
  facts.replaceChildren(
    ...[
      `${card.minutes} min`,
      card.energy === "gentle" ? "Gentle energy" : "A little movement",
      card.modes.length === 2
        ? "Solo or together"
        : card.modes[0] === "solo"
          ? "Solo"
          : "Together",
      card.place === "any"
        ? "Flexible location"
        : card.place === "inside"
          ? "Inside"
          : "Outside",
    ].map((t) => element("span", "", t)),
  );
  $("challenge-materials").textContent = "You'll need: " + card.materials + ".";
  $("challenge-steps").replaceChildren(
    ...card.steps.map((step, i) => {
      const li = element("li"),
        label = element("label"),
        input = element("input");
      input.type = "checkbox";
      input.checked = a.checked.includes(i);
      input.disabled = done;
      input.setAttribute("aria-label", `Step ${i + 1}: ${step}`);
      input.addEventListener("change", () =>
        change(
          (s) => {
            s.active.checked = input.checked
              ? [...new Set([...s.active.checked, i])]
              : s.active.checked.filter((n) => n !== i);
          },
          { renderNow: false },
        ),
      );
      label.append(input, element("span", "", step));
      li.append(label);
      return li;
    }),
  );
  $("start-button").hidden = a.phase !== "ready";
  $("finish-button").hidden = !active;
  $("next-button").hidden = !done;
  $("skip-button").hidden = done;
  $("timer-panel").hidden = !active;
  $("completion-panel").hidden = !done;
  $("pause-button").hidden = a.phase === "expired";
  $("pause-button").textContent = a.phase === "paused" ? "Resume" : "Pause";
  $("timer-label").textContent =
    a.phase === "paused"
      ? "Paused. Take your time."
      : a.phase === "expired"
        ? "Time's up. How did it go?"
        : "Your tiny timebox";
  $("reward-label").textContent = `+${a.reward} sparks`;
  $("reward-note").textContent =
    a.reward > [10, 20, 35][[2, 5, 15].indexOf(card.minutes)]
      ? "Daily trio complete! Includes your +30 spark bonus."
      : "A little adventure looks good on you.";
  $("challenge-note").textContent = done
    ? "Your completion is saved. Small adventures count."
    : active
      ? "The timer keeps counting while you are away. Finish whenever you feel done."
      : "Start the optional timer. Finish whenever your adventure feels complete.";
  updateTimerText();
}
function updateTimerText() {
  const a = state.active;
  if (!a) return;
  const seconds = Math.ceil(remaining(a) / 1000);
  $("timer-output").textContent =
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function renderProgress() {
  lastRenderedDay = localDay();
  $("sparks-count").textContent = state.sparks.toLocaleString();
  $("completed-count").textContent = state.total.toLocaleString();
  $("streak-count").textContent = streakToday(state);
  $("saved-count").textContent = state.favorites.length;
  $("pocket-button").setAttribute(
    "aria-label",
    `Open your idea pocket, ${state.favorites.length} saved ideas`,
  );
  const count = state.dayCounts[localDay()] || 0;
  const circles = $("trio-circles");
  circles.setAttribute(
    "aria-label",
    `${Math.min(count, 3)} of 3 adventures completed today`,
  );
  [...circles.children].slice(0, 3).forEach((e, i) => {
    e.classList.toggle("reached", count > i);
    e.textContent = count > i ? "✓" : String(i + 1);
  });
  $("daily-progress-text").textContent =
    count >= 3
      ? "Today's trio is complete. +30 bonus sparks earned!"
      : `${count} of 3 completed today · +30 bonus sparks`;
  $("daily-caption").textContent =
    count >= 3
      ? "You made a little room for fun. Tomorrow brings a fresh trio."
      : "Three tiny adventures today. A little bonus for showing up.";
  const history = $("history-list");
  history.replaceChildren();
  if (!state.history.length) {
    history.append(
      element(
        "p",
        "empty-history",
        "Your first adventure is just a spin away.",
      ),
    );
    return;
  }
  for (const h of state.history.slice(0, 6)) {
    const c = cat(h.category),
      item = element("article", "history-item");
    item.style.setProperty("--category", c.color);
    const meta = element("p"),
      date =
        h.day === localDay()
          ? "Today"
          : new Date(h.day + "T12:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
    meta.append(
      element("span", "", c.name + " · " + date),
      element("strong", "", `+${h.points} sparks`),
    );
    item.append(element("span", "", c.mark), element("h3", "", h.title), meta);
    history.append(item);
  }
}
function render() {
  document.documentElement.dataset.theme = state.settings.theme;
  audio.setEnabled(state.settings.sound);
  $("sound-button").setAttribute("aria-pressed", String(state.settings.sound));
  $("sound-button").setAttribute(
    "aria-label",
    state.settings.sound ? "Turn sound off" : "Turn sound on",
  );
  $("sound-button").title = state.settings.sound ? "Sound on" : "Sound off";
  renderFilters();
  renderWheel();
  renderChallenge();
  renderProgress();
}
function toggleFavorite(id) {
  change((s) => {
    s.favorites = s.favorites.includes(id)
      ? s.favorites.filter((v) => v !== id)
      : [...s.favorites, id];
  });
}
function closeDialog() {
  for (const link of $("dialog-body").querySelectorAll("a[data-download]")) {
    const url = downloadURLs.get(link);
    if (url) setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  const callback = dialogCloseAction;
  dialogCloseAction = undefined;
  if (typeof $("app-dialog").close === "function") $("app-dialog").close();
  else $("app-dialog").removeAttribute("open");
  document.body.style.overflow = "";
  document.body.classList.remove("dialog-fallback");
  previousFocus?.isConnected && previousFocus.focus({ preventScroll: true });
  callback?.();
}
function openDialog(title, build) {
  if ($("app-dialog").open) closeDialog();
  previousFocus = document.activeElement;
  $("dialog-title").textContent = title;
  $("dialog-body").replaceChildren();
  build($("dialog-body"));
  document.body.style.overflow = "hidden";
  if (typeof $("app-dialog").showModal === "function")
    $("app-dialog").showModal();
  else {
    $("app-dialog").setAttribute("open", "");
    document.body.classList.add("dialog-fallback");
  }
  $("close-dialog").focus();
}
function confirmAction(title, message, action = "Continue") {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (value) => {
      if (!answered) {
        answered = true;
        resolve(value);
      }
    };
    openDialog(title, (body) => {
      body.append(element("p", "", message));
      const actions = element("div", "dialog-actions");
      actions.append(
        button("Keep going", "soft-button", () => {
          answer(false);
          closeDialog();
        }),
        button(action, "primary-button", () => {
          answer(true);
          closeDialog();
        }),
      );
      body.append(actions);
    });
    dialogCloseAction = () => answer(false);
  });
}
async function mayReplace() {
  if (!["running", "paused", "expired"].includes(state.active?.phase))
    return true;
  if (confirmationPending) return false;
  confirmationPending = true;
  try {
    return await confirmAction(
      "Leave this little adventure?",
      "The current timer and checkmarks will be replaced. Completed adventures and saved ideas stay in your pocket.",
      "Choose a new idea",
    );
  } finally {
    confirmationPending = false;
  }
}
function finishSpin(version) {
  if (version !== spinVersion || !spinning) return;
  clearTimeout(spinTimer);
  spinning = false;
  render();
  audio.play("land");
  notify("Your next tiny adventure is ready.");
  if (innerWidth < 800)
    $("challenge-card").scrollIntoView({
      behavior: reduced.matches ? "auto" : "smooth",
      block: "start",
    });
  $("challenge-title").focus({ preventScroll: true });
}
async function spin() {
  if (spinning || confirmationPending) return;
  if (!(await mayReplace())) return;
  const selected = chooseChallenge(state, CHALLENGES, random);
  if (!selected) {
    notify("No matching ideas. Try changing your filters.");
    return;
  }
  const applied = change(
    (s) =>
      offerChallenge(s, selected.card, token(), {
        recycled: selected.recycled,
        builtin: CHALLENGES,
      }),
    { renderNow: false },
  );
  if (!applied) return;
  spinning = true;
  const version = ++spinVersion;
  angle = wheelTarget(angle, selected.card.category, 5);
  render();
  $("wheel-art").style.transition = reduced.matches
    ? "none"
    : "transform 3.1s cubic-bezier(.16,.75,.16,1)";
  $("wheel-art").style.transform = `rotate(${angle}deg)`;
  audio.unlock().then((ok) => {
    if (ok && spinning) audio.play("spin");
  });
  spinTimer = setTimeout(
    () => finishSpin(version),
    reduced.matches ? 30 : 3200,
  );
}
async function chooseSaved(id) {
  if (!(await mayReplace())) return;
  const card = allChallenges(state, CHALLENGES).find((c) => c.id === id);
  if (!card) return;
  cancelSpin();
  if (!change((s) => offerChallenge(s, card, token()))) return;
  angle = wheelTarget(angle, card.category, 0);
  $("wheel-art").style.transform = `rotate(${angle}deg)`;
  closeDialog();
  $("challenge-card").scrollIntoView({
    behavior: reduced.matches ? "auto" : "smooth",
    block: "nearest",
  });
  $("challenge-title").focus({ preventScroll: true });
}
function celebrate() {
  if (reduced.matches) return;
  const box = $("confetti");
  box.replaceChildren();
  for (let i = 0; i < 30; i++) {
    const piece = element("span");
    piece.style.left = 12 + random() * 76 + "%";
    piece.style.background = CATEGORIES[i % 6].color;
    piece.style.animationDelay = random() * 0.25 + "s";
    piece.style.borderRadius = i % 3 === 0 ? "50%" : "2px";
    box.append(piece);
  }
  setTimeout(() => box.replaceChildren(), 2300);
}
function showHelp() {
  openDialog("A little guide to a good time", (body) => {
    body.append(
      element(
        "p",
        "",
        "Boredom Roulette offers 120 original, low-stakes mini adventures. There are no bets, purchases or prizes with cash value. Sparks are just a playful record of things you chose to try.",
      ),
    );
    const list = element("ol");
    for (const t of [
      "Choose your maximum time, solo or together, energy and location. Flexible location includes both indoor and outdoor ideas.",
      "Tap category chips to include or exclude them. Spin chooses an available category equally, then an unseen idea in that category. Once every matching idea has appeared, the deck reshuffles.",
      "Read the idea. Start the timer if you want to try it. Check off steps as you go, pause whenever you like, and tap ‘I did it!’ to record a completion.",
      "Save favorites with the star. Your pocket also lets you choose a card directly, search all ideas, or add up to 40 of your own.",
      "Complete three adventures in one local calendar day for a one-time +30 spark bonus. A completion on consecutive days grows your streak.",
    ]) {
      list.append(element("li", "", t));
    }
    body.append(list);
    body.append(
      element("h3", "", "A few kind ground rules"),
      element(
        "p",
        "",
        "Adapt any idea to your comfort, mobility, space and company. Steps are suggestions, not a test. Together means people who want to play; anyone can pass. You can finish early or ask for another idea without losing sparks.",
      ),
      element("h3", "", "Timers, sound and saving"),
      element(
        "p",
        "",
        "The timer uses the clock, so it keeps counting when the page is in the background. A timer ending never automatically awards points. Sound starts off and plays only short, locally generated chimes. Background chimes are not guaranteed. Progress is saved in this browser when storage is available; backups are in Settings.",
      ),
      element("h3", "", "Your own corner of the internet"),
      element(
        "p",
        "",
        "No login, ads, remote AI, analytics or external runtime downloads. Once offline setup is ready, the game and every original idea can run without a connection. Browser storage can be cleared or evicted; keep a backup of ideas you care about.",
      ),
      element(
        "p",
        "dialog-note",
        "Designed & developed by Noorullah Adel · 2026. Original code, graphics, sound and challenge content are provided under the MIT License. Credits and license links are in the footer.",
      ),
    );
    body.append(
      button("Install & offline guide", "primary-button", showInstall),
    );
  });
}
function showInstall() {
  openDialog("Take a little fun with you", (body) => {
    body.append(
      element(
        "p",
        "",
        "Install the game for quick access from your Home Screen or desktop. The ordinary browser version works too.",
      ),
      element("h3", "", "iPhone & iPad · Safari"),
    );
    const steps = element("ol");
    for (const text of [
      "Open this game's deployed HTTPS address in Safari.",
      "Tap Share, then Add to Home Screen. You may need More or Edit Actions to find it.",
      "Enable Open as Web App if that option appears, then tap Add.",
      "Open the new Home Screen icon while online. Wait for ‘Ready for offline adventures’ before testing in Airplane Mode.",
    ]) {
      steps.append(element("li", "", text));
    }
    body.append(steps);
    body.append(
      element("h3", "", "Android & desktop"),
      element(
        "p",
        "",
        "Use your browser's Install app or Add to Home screen menu when available. An ‘Install now’ button appears in this app only when your browser supplies an installation prompt. Firefox, Safari, Chrome and Edge offer different installation options; an unsupported install menu does not stop normal browser play.",
      ),
      element("h3", "", "Offline check"),
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
        "A connection is needed for the first visit and updates. Keep the installed game closed until deployment has succeeded. Device storage policies can remove cached files; reconnect and use Try again if offline setup becomes incomplete.",
      ),
    );
  });
}
function showMilestones() {
  openDialog("Little things. Lovely milestones.", (body) => {
    body.append(
      element(
        "p",
        "",
        `${state.total} adventures completed · ${state.sparks} sparks · best streak: ${state.streak.best} days.`,
      ),
    );
    for (const item of badges(state)) {
      const row = element("div", "milestone" + (item.earned ? " earned" : "")),
        copy = element("div");
      copy.append(
        element("strong", "", item.name),
        element("p", "", item.description),
      );
      row.append(element("span", "", item.earned ? "✦" : "◇"), copy);
      body.append(row);
    }
    body.append(
      element(
        "p",
        "dialog-note",
        "Milestones and sparks are for fun. Take breaks, repeat an idea you love, and play at your own pace.",
      ),
    );
  });
}
function showPocket(tab = "saved") {
  let current = tab,
    limit = 12,
    query = "";
  openDialog("Your little idea pocket", (body) => {
    const tabs = element("div", "pocket-tabs"),
      list = element("div", "pocket-list"),
      search = element("input", "text-input"),
      note = element(
        "p",
        "dialog-note",
        "Spin filters apply to the wheel. Choosing a card here uses that idea directly; check its time, location and player tags first.",
      );
    search.type = "search";
    search.placeholder = "Find an idea…";
    search.setAttribute("aria-label", "Search your idea pocket");
    const options = [
        ["saved", "Saved ideas"],
        ["all", "All ideas"],
        ["mine", "My ideas"],
      ],
      tabButtons = [];
    function draw() {
      list.replaceChildren();
      for (const b of tabButtons)
        b.setAttribute("aria-pressed", String(b.dataset.tab === current));
      let cards = allChallenges(state, CHALLENGES).filter(
        (c) =>
          current === "all" ||
          (current === "mine" && c.custom) ||
          (current === "saved" && state.favorites.includes(c.id)),
      );
      if (query)
        cards = cards.filter((c) =>
          (c.title + " " + cat(c.category).name + " " + c.materials)
            .toLocaleLowerCase()
            .includes(query),
        );
      if (!cards.length) {
        list.append(
          element(
            "p",
            "empty-history",
            current === "saved"
              ? "Save an idea with its star and it will be waiting here."
              : current === "mine"
                ? "Your own inside jokes and tiny adventures belong here."
                : "No ideas found. Try a shorter search.",
          ),
        );
      }
      for (const c of cards.slice(0, limit)) {
        const item = element("article", "pocket-card"),
          head = element("div", "pocket-card-head"),
          star = button(
            state.favorites.includes(c.id) ? "★" : "☆",
            "icon-button",
            () => {
              toggleFavorite(c.id);
              draw();
            },
          );
        star.setAttribute(
          "aria-label",
          state.favorites.includes(c.id)
            ? "Unsave " + c.title
            : "Save " + c.title,
        );
        star.setAttribute(
          "aria-pressed",
          String(state.favorites.includes(c.id)),
        );
        head.append(element("h3", "", c.title), star);
        item.append(
          head,
          element(
            "p",
            "",
            `${cat(c.category).name} · ${c.minutes} min · ${c.modes.length === 2 ? "solo or together" : c.modes[0]} · ${c.place === "any" ? "flexible location" : c.place}`,
          ),
          element("p", "", c.steps[0]),
        );
        const actions = element("div", "dialog-actions");
        actions.append(
          button("Choose this idea ↗", "soft-button", () => chooseSaved(c.id)),
        );
        if (c.custom)
          actions.append(
            button("Delete idea", "text-button", async () => {
              const yes = await confirmAction(
                "Delete this custom idea?",
                "This removes the custom idea from this browser and its favorites. Your completed history stays in your journal.",
                "Delete idea",
              );
              if (!yes) return;
              cancelSpin();
              change((s) => {
                s.custom = s.custom.filter((x) => x.id !== c.id);
                s.favorites = s.favorites.filter((id) => id !== c.id);
                s.seen = s.seen.filter((id) => id !== c.id);
                if (s.active?.id === c.id) s.active = null;
              });
              closeDialog();
              showPocket("mine");
            }),
          );
        item.append(actions);
        list.append(item);
      }
      if (cards.length > limit)
        list.append(
          button(
            `Show more · ${cards.length - limit} remaining`,
            "soft-button",
            () => {
              limit += 12;
              draw();
            },
          ),
        );
    }
    for (const [id, title] of options) {
      const b = button(title, "", () => {
        current = id;
        limit = 12;
        draw();
      });
      b.dataset.tab = id;
      tabButtons.push(b);
      tabs.append(b);
    }
    search.addEventListener("input", () => {
      query = search.value.toLocaleLowerCase().trim();
      limit = 12;
      draw();
    });
    body.append(
      tabs,
      search,
      note,
      list,
      button("+ Add your own little adventure", "primary-button", showNewIdea),
    );
    draw();
  });
}
function showNewIdea() {
  openDialog("Make the wheel a little more you", (body) => {
    body.append(
      element(
        "p",
        "",
        `Add an inside joke, a tiny tradition, or an idea of your own. ${state.custom.length} of 40 custom slots used. Text stays in this browser.`,
      ),
    );
    const form = element("form", "new-idea"),
      fields = {};
    function field(label, name, input, full = false) {
      const l = element("label", full ? "full-field" : "", label);
      input.name = name;
      fields[name] = input;
      l.append(input);
      form.append(l);
      return input;
    }
    const title = field(
      "Give it a name",
      "title",
      element("input", "text-input"),
      true,
    );
    title.required = true;
    title.maxLength = 72;
    title.placeholder = "e.g. A heroic theme tune for my houseplant";
    function select(label, name, options) {
      const e = element("select", "text-input");
      for (const [value, text] of options) {
        const o = element("option", "", text);
        o.value = value;
        e.append(o);
      }
      return field(label, name, e);
    }
    select(
      "Category",
      "category",
      CATEGORIES.map((c) => [c.id, c.name]),
    );
    select("A little timebox", "minutes", [
      ["2", "2 minutes"],
      ["5", "5 minutes"],
      ["15", "15 minutes"],
    ]);
    select("Players", "modes", [
      ["both", "Solo or together"],
      ["solo", "Solo"],
      ["together", "Together"],
    ]);
    select("Energy", "energy", [
      ["gentle", "Gentle"],
      ["active", "A little movement"],
    ]);
    select("Location", "place", [
      ["any", "Flexible"],
      ["inside", "Inside"],
      ["outside", "Outside"],
    ]);
    const materials = field(
      "You'll need",
      "materials",
      element("input", "text-input"),
    );
    materials.required = true;
    materials.maxLength = 100;
    materials.value = "Nothing extra";
    const steps = field(
      "What happens? One step per line, up to three.",
      "steps",
      element("textarea", "text-input"),
      true,
    );
    steps.required = true;
    steps.maxLength = 574;
    steps.placeholder =
      "Invent the theme tune.\nPerform it to your most supportive houseplant.";
    const error = element("p", "form-error"),
      submit = button("Save my little adventure ↗", "primary-button");
    error.setAttribute("role", "alert");
    submit.type = "submit";
    submit.disabled = state.custom.length >= 40;
    form.append(error, submit);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      try {
        if (state.custom.length >= 40)
          throw Error(
            "Your 40 custom slots are full. Delete an old idea first.",
          );
        const c = validateChallenge(
          {
            id: "custom-" + token().replace(/[^a-z0-9-]/g, ""),
            title: fields.title.value.trim(),
            category: fields.category.value,
            minutes: Number(fields.minutes.value),
            energy: fields.energy.value,
            place: fields.place.value,
            modes:
              fields.modes.value === "both"
                ? ["solo", "together"]
                : [fields.modes.value],
            materials: fields.materials.value.trim(),
            steps: fields.steps.value
              .split(/\r?\n/)
              .map((t) => t.trim())
              .filter(Boolean),
          },
          true,
        );
        if (
          change((s) => {
            s.custom.push(c);
            s.favorites.push(c.id);
          })
        ) {
          closeDialog();
          notify("Your idea is saved and ready for the wheel.");
          showPocket("mine");
        }
      } catch (err) {
        error.textContent = err.message;
      }
    });
    body.append(form);
  });
}
function exportBackup(link, announce = true) {
  if (records.broken && records.raw) {
    prepareDownload(
      link,
      "boredom-roulette-original-record.txt",
      records.raw,
      "text/plain;charset=utf-8",
    );
    if (announce)
      notify("Original record ready. Your browser controls the download.");
    return;
  }
  prepareDownload(
    link,
    `boredom-roulette-backup-${localDay()}.json`,
    JSON.stringify(
      {
        app: "boredom-roulette",
        version: 1,
        exportedAt: new Date().toISOString(),
        state,
      },
      null,
      2,
    ),
    "application/json;charset=utf-8",
  );
  if (announce)
    notify("Backup ready. Keep the downloaded file somewhere safe.");
}
async function importBackup(file) {
  if (!file) return;
  try {
    if (file.size > 1048576) throw Error("Choose a backup smaller than 1 MB.");
    const content = await file.text(),
      data = JSON.parse(content);
    if (data.app !== "boredom-roulette" || data.version !== 1)
      throw Error("Choose a Boredom Roulette version 1 backup.");
    const restored = validateState(data.state, CHALLENGES);
    if (
      !(await confirmAction(
        "Replace this browser's game record?",
        "The backup will replace progress, favorites, custom ideas, settings and the current challenge. Download a backup of this browser first if you want to keep both.",
        "Import backup",
      ))
    )
      return;
    cancelSpin();
    if (change((s) => Object.assign(s, restored), { replaceBroken: true })) {
      closeDialog();
      notify(
        "Your backup is restored. Welcome back to your little adventures.",
      );
    }
  } catch (err) {
    notify("Could not import: " + err.message);
  }
}
function showReset() {
  openDialog("A fresh little start", (body) => {
    body.append(
      element(
        "p",
        "",
        "Reset this app's progress, favorites, custom ideas, settings and active challenge in this browser. Download a backup first if you want to keep them.",
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
        "I understand that this browser's Boredom Roulette record will be reset.",
      ),
    );
    const reset = button("Reset this app", "primary-button", () => {
      cancelSpin();
      if (
        change((s) => Object.assign(s, initialState()), { replaceBroken: true })
      ) {
        closeDialog();
        notify("A fresh start. Your next little adventure is waiting.");
      }
    });
    reset.disabled = true;
    check.addEventListener("change", () => (reset.disabled = !check.checked));
    body.append(label, reset);
  });
}
function showSettings() {
  openDialog("Your kind of little adventure", (body) => {
    function row(title, note, control) {
      const item = element("div", "settings-row"),
        copy = element("div");
      copy.append(element("strong", "", title), element("span", "", note));
      item.append(copy, control);
      body.append(item);
    }
    const sound = button(
      state.settings.sound ? "On" : "Off",
      "switch-button",
      async () => {
        if (
          change((s) => {
            s.settings.sound = !s.settings.sound;
          })
        ) {
          sound.textContent = state.settings.sound ? "On" : "Off";
          sound.setAttribute("aria-pressed", String(state.settings.sound));
          if (state.settings.sound) {
            if (await audio.unlock()) audio.play("land");
            else
              notify(
                "Sound isn't available right now. The game can still be played silently.",
              );
          }
        }
      },
    );
    sound.setAttribute("aria-pressed", String(state.settings.sound));
    sound.setAttribute("aria-label", "Optional game sounds");
    row(
      "A little sound",
      "Short original spin and completion chimes. Starts off.",
      sound,
    );
    const theme = button(
      state.settings.theme === "dark" ? "Dark" : "Light",
      "switch-button",
      () => {
        change(
          (s) =>
            (s.settings.theme = s.settings.theme === "dark" ? "light" : "dark"),
        );
        theme.textContent = state.settings.theme === "dark" ? "Dark" : "Light";
        theme.setAttribute(
          "aria-pressed",
          String(state.settings.theme === "dark"),
        );
      },
    );
    theme.setAttribute("aria-pressed", String(state.settings.theme === "dark"));
    theme.setAttribute("aria-label", "Dark appearance");
    row(
      "Set the mood",
      "Choose light paper or a quieter dark appearance.",
      theme,
    );
    const custom = button(
      state.settings.includeCustom ? "On" : "Off",
      "switch-button",
      () => {
        change((s) => {
          s.settings.includeCustom = !s.settings.includeCustom;
        });
        custom.textContent = state.settings.includeCustom ? "On" : "Off";
        custom.setAttribute(
          "aria-pressed",
          String(state.settings.includeCustom),
        );
      },
    );
    custom.setAttribute("aria-pressed", String(state.settings.includeCustom));
    custom.setAttribute("aria-label", "Include custom ideas in wheel spins");
    row(
      "Your ideas in the mix",
      "Include your custom cards when they match the filters.",
      custom,
    );
    body.append(
      element("h3", "", "Keep your little stories"),
      element(
        "p",
        "",
        "This browser saves your progress when local storage is available. A backup includes custom ideas, favorites, scores, settings and the active timer. Browser data and offline files can be cleared by the device; backups are your own portable copy.",
      ),
    );
    const actions = element("div", "dialog-actions"),
      input = element("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.hidden = true;
    input.addEventListener("change", () => importBackup(input.files[0]));
    const backupLink = element("a", "soft-button", "Download backup");
    exportBackup(backupLink, false);
    backupLink.addEventListener("click", () => exportBackup(backupLink));
    actions.append(
      backupLink,
      button("Import backup", "soft-button", () => input.click()),
      input,
    );
    body.append(
      actions,
      element(
        "p",
        "dialog-note",
        "Reduced-motion preferences are respected automatically. The wheel settles quickly, confetti is skipped, and result scrolling stays still. Streaks and daily bonuses use your device's local calendar date.",
      ),
      button("Reset this app's local record", "text-button", showReset),
    );
  });
}
function shareCurrent() {
  const card = cardNow();
  if (!card) return;
  const text = challengeText(card);
  openDialog("Share a little adventure", (body) => {
    body.append(
      element(
        "p",
        "",
        "Send a little possibility to someone, or keep the text for later. You can always select and copy it using your browser's copy command.",
      ),
    );
    const area = element("textarea", "copy-area"),
      status = element("p", "dialog-note"),
      actions = element("div", "dialog-actions");
    area.readOnly = true;
    area.value = text;
    area.setAttribute("aria-label", "Challenge text to copy");
    status.setAttribute("role", "status");
    status.textContent = "Select the text below, or use Copy text.";
    const select = button("Select text", "soft-button", () => {
      area.focus();
      area.select();
      status.textContent =
        "Text selected. Use Copy from your browser or keyboard.";
    });
    const copy = button("Copy text", "soft-button", async () => {
      copy.disabled = true;
      copy.textContent = "Copying…";
      try {
        if (!navigator.clipboard?.writeText) throw Error("Unavailable");
        let deadline;
        try {
          await Promise.race([
            navigator.clipboard.writeText(text),
            new Promise((_, reject) => {
              deadline = setTimeout(
                () => reject(Error("Clipboard unavailable")),
                1400,
              );
            }),
          ]);
        } finally {
          clearTimeout(deadline);
        }
        if (status.isConnected)
          status.textContent =
            "Copied. Your little adventure is ready to share.";
      } catch {
        if (status.isConnected) {
          status.textContent =
            "Automatic copy isn't available here. Select the text and use your browser's Copy command.";
          area.focus();
          area.select();
        }
      } finally {
        if (copy.isConnected) {
          copy.disabled = false;
          copy.textContent = "Copy text";
        }
      }
    });
    actions.append(select, copy);
    if (navigator.share) {
      const share = button("Open share menu ↗", "soft-button", async () => {
        share.disabled = true;
        try {
          await navigator.share({
            title: "Boredom Roulette · " + card.title,
            text,
          });
          if (status.isConnected)
            status.textContent = "Thanks for sharing a little fun.";
        } catch (error) {
          if (status.isConnected && error.name !== "AbortError")
            status.textContent =
              "The share menu isn't available here. You can select and copy the text instead.";
        } finally {
          if (share.isConnected) share.disabled = false;
        }
      });
      actions.append(share);
    }
    body.append(area, status, actions);
  });
}
$("close-dialog").addEventListener("click", closeDialog);
$("app-dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDialog();
});
$("app-dialog").addEventListener("click", (e) => {
  if (e.target !== $("app-dialog")) return;
  const rect = $("app-dialog").getBoundingClientRect();
  if (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  )
    closeDialog();
});
$("app-dialog").addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeDialog();
    return;
  }
  if (e.key !== "Tab") return;
  const focusable = [
    ...$("app-dialog").querySelectorAll(
      "button:not(:disabled), input:not(:disabled), select, textarea, a[href]",
    ),
  ].filter((el) => !el.hidden && el.getClientRects().length);
  const first = focusable[0],
    last = focusable.at(-1);
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last?.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first?.focus();
  }
});
for (const id of ["help-button", "footer-help"])
  $(id).addEventListener("click", showHelp);
$("settings-button").addEventListener("click", showSettings);
$("pocket-button").addEventListener("click", () => showPocket());
$("badges-button").addEventListener("click", showMilestones);
$("filter-form").addEventListener("submit", (e) => e.preventDefault());
for (const id of ["minutes", "mode", "energy", "place"])
  $(id + "-filter").addEventListener("change", () =>
    change(
      (s) =>
        (s.settings[id] =
          id === "minutes"
            ? Number($(id + "-filter").value)
            : $(id + "-filter").value),
    ),
  );
for (const category of CATEGORIES) {
  const b = button("", "category-chip", () =>
    change((s) => {
      s.settings.categories = s.settings.categories.includes(category.id)
        ? s.settings.categories.filter((c) => c !== category.id)
        : [...s.settings.categories, category.id];
    }),
  );
  b.dataset.category = category.id;
  b.append(
    element("span", "", category.mark),
    document.createTextNode(category.name),
  );
  b.style.setProperty("--category", category.color);
  $("category-chips").append(b);
}
const resetFilters = button("Reset spin filters", "text-button", () =>
  change((s) => {
    const d = initialState();
    for (const key of ["minutes", "mode", "energy", "place", "categories"])
      s.settings[key] = d.settings[key];
  }),
);
resetFilters.id = "reset-filters-button";
resetFilters.hidden = true;
$("wheel-status").after(resetFilters);
for (const id of ["spin-button", "skip-button", "next-button"])
  $(id).addEventListener("click", spin);
$("start-button").addEventListener("click", () => {
  if (change((s) => startTimer(s))) {
    audio.unlock().then((ok) => ok && audio.play("land"));
    notify("Your little adventure starts now. Finish whenever you feel done.");
  }
});
$("pause-button").addEventListener("click", () =>
  change((s) => (s.active?.phase === "paused" ? startTimer(s) : pauseTimer(s))),
);
$("finish-button").addEventListener("click", () => {
  let result;
  if (
    change((s) => {
      result = completeChallenge(s, CHALLENGES);
      return Boolean(result);
    }) &&
    result
  ) {
    audio.unlock().then((ok) => ok && audio.play("complete"));
    celebrate();
    notify(
      `A little adventure completed. +${result.total} sparks${result.bonus ? ", including your daily trio bonus" : ""}!`,
    );
  }
});
$("favorite-button").addEventListener("click", () => {
  if (state.active) toggleFavorite(state.active.id);
});
$("sound-button").addEventListener("click", async () => {
  if (
    change((s) => {
      s.settings.sound = !s.settings.sound;
    }) &&
    state.settings.sound
  ) {
    if (await audio.unlock()) audio.play("land");
    else notify("Sound isn't available right now. Silent play still works.");
  }
});
$("share-button").addEventListener("click", shareCurrent);
$("download-card").addEventListener("click", () => {
  notify("SVG idea card ready. Your browser controls the download.");
});
window.addEventListener("storage", (e) => {
  if (e.key === records.key || e.key === null) adoptLatest();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (spinning) finishSpin(spinVersion);
    audio.quiet();
  } else {
    if (state.active?.phase === "running" && remaining(state.active) === 0)
      change((s) => settleTimer(s));
    else renderProgress();
    updateTimerText();
  }
});
setInterval(() => {
  if (state.active?.phase === "running" && remaining(state.active) === 0) {
    if (change((s) => settleTimer(s))) {
      if (!document.hidden) audio.play("land");
      notify("Time's up. Finish your adventure whenever you're ready.");
    }
  } else updateTimerText();
  if (!document.hidden && localDay() !== lastRenderedDay) renderProgress();
}, 1000);
if (state.active) {
  const c = cardNow();
  if (c) {
    angle = wheelTarget(0, c.category, 0);
    $("wheel-art").style.transform = `rotate(${angle}deg)`;
  }
}
if (state.active?.phase === "running" && remaining(state.active) === 0)
  change((s) => settleTimer(s));
else render();
const pwa = initPWA({
  onInstallGuide: showInstall,
  beforeUpdate: () => {
    if (spinning) finishSpin(spinVersion);
    audio.quiet();
  },
  notify,
});
