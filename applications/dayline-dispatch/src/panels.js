/* Game panels. All station and city labels come from the bundled fictional maps. */
import { CITIES, MODES, LINES, dailyPlan } from "./cities.js";
import { waiting, aboard, score, medal, seats } from "./engine.js";
import { recordKey } from "./records.js";

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
export function makePanels({
  get,
  open,
  close,
  pick,
  begin,
  retry,
  finish,
  sound,
  focus,
  repair,
  reload,
}) {
  const body = document.getElementById("dialog-content");
  const section = (title, install = false) => {
    open(title, install);
    body.replaceChildren();
  };
  const p = (text) => body.append(el("p", text));
  const heading = (text) => body.append(el("h3", text));
  function button(parent, label, act, style = "") {
    const b = el("button", label, style);
    b.type = "button";
    b.addEventListener("click", act);
    parent.append(b);
    return b;
  }
  function actions(...items) {
    const row = el("div", undefined, "dialog-actions");
    body.append(row);
    items.forEach(([label, act, style]) => button(row, label, act, style));
  }
  function menu(label, detail, act) {
    const b = button(body, "", act, "menu-row");
    b.append(el("span", label), el("small", detail));
    return b;
  }
  function help() {
    const { s } = get(),
      names = CITIES[s.city].stations;
    section("How to play");
    [
      [
        "Run the first train",
        "Start your shift. Line A already takes passengers between three stations. The number above a stop is its queue.",
      ],
      [
        "Connect a fourth station",
        "Select B, then Draw line B. Tap " +
          names[3].name +
          " and " +
          names[1].name +
          ", then Save line. Sharing a station lets riders change trains.",
      ],
      [
        "Follow the crowds",
        "Tap a station to see where people want to go. Use C or edit an existing route as new stops open. A line can visit two to five stops. The clock pauses while you plan.",
      ],
      [
        "Answer dispatch",
        "Deliver three riders to the starred stop before the call expires for 50 points and an extra seat on every train, up to eight seats. Green Wave speeds up trains for eight seconds and recharges in thirty.",
      ],
    ].forEach(([title, desc], i) => {
      const row = el("div", undefined, "help-step"),
        copy = el("div");
      copy.append(el("b", title), el("p", desc));
      row.append(el("span", i + 1), copy);
      body.append(row);
    });
    p(
      "One delivery earns 10 points. A passenger who changes trains earns 4 extra. In timed shifts, riders walk away after about 62 seconds of accumulated platform waiting.",
    );
    p(
      "You can tap stations individually, drag along a route, or use the Stops list. Keyboard: 1–3 choose a line, E edits, G calls Green Wave, Space runs or pauses, and Escape closes a panel.",
    );
    actions(["Back to map", () => close(), "primary"]);
  }
  function install() {
    section("Install & play offline", true);
  }
  function records() {
    const { book } = get();
    section("Your best tickets");
    if (!book.bests.length)
      p(
        "Finish a shift to stamp your first ticket. Records are saved on this device.",
      );
    for (const b of [...book.bests].sort((x, y) => y.score - x.score)) {
      const [mode, key] = b.key.split(":");
      const label =
        MODES[mode] +
        " · " +
        (mode === "daily" ? key : CITIES[Number(key)].name);
      const row = el("p");
      row.append(
        el("b", label),
        el("br"),
        el("span", b.score + " points · " + b.served + " delivered"),
      );
      body.append(row);
    }
    actions(["Back", settings]);
  }
  function settings() {
    const { s, book, storageIssue } = get();
    section("Dispatch settings");
    menu("Sound", book.sound ? "On" : "Off", () => {
      sound();
      settings();
    });
    menu("Install & play offline", "Home Screen", install);
    menu("Toggle full screen", "Display", focus);
    menu("Your best tickets", String(book.bests.length), records);
    if (s.phase !== "ready" && s.phase !== "done")
      menu("Finish this shift", "Stamp ticket", confirmEnd);
    if (storageIssue === "conflict")
      menu("Load latest saved shift", "Another tab", reload);
    if (storageIssue === "invalid")
      menu("Repair local save", "Review", () => {
        section("Repair local save");
        p(
          "Your saved data could not be read. Replace it with the current shift and the records visible in this session?",
        );
        actions(
          ["Keep old save", settings],
          ["Replace local save", repair, "primary"],
        );
      });
    if (storageIssue === "unavailable")
      p(
        "Saving is unavailable in this browser session. You can keep playing while this page stays open.",
      );
    heading("Created by Noorullah Adel");
    p(
      "Developed and designed in 2026. Game, maps and sounds are MIT licensed. Barlow Condensed by the Barlow Project Authors uses the SIL Open Font License 1.1.",
    );
    const links = el("p");
    for (const [text, url] of [
      ["Game license", "./LICENSE"],
      ["Credits & font license", "./THIRD_PARTY_NOTICES.md"],
    ]) {
      const a = el("a", text);
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      if (links.childNodes.length) links.append(" · ");
      links.append(a);
    }
    body.append(links);
  }
  function confirmEnd() {
    section("Finish this shift?");
    p(
      "Stamp your ticket with the passengers and points you have earned so far.",
    );
    actions(
      ["Keep playing", () => close()],
      ["Finish shift", finish, "primary"],
    );
  }
  function stationList() {
    const { s, draft } = get(),
      city = CITIES[s.city];
    section(draft ? "Add a stop to your line" : "Station board");
    p(
      draft
        ? "Select the next stop in travel order."
        : "Select a station to inspect it on the map.",
    );
    for (let i = 0; i < s.open; i++) {
      const lines = s.routes
        .map((r, n) => (r.includes(i) ? LINES[n].code : ""))
        .filter(Boolean)
        .join("·");
      const b = menu(
        city.stations[i].name,
        s.queues[i].length + " waiting · " + (lines || "unconnected"),
        () => {
          close();
          pick(i);
        },
      );
      if (draft && draft.includes(i)) {
        b.disabled = true;
        b.lastChild.textContent =
          "Stop " + (draft.indexOf(i) + 1) + " on draft";
      }
    }
  }
  const descriptions = {
    shift:
      "Run a three-minute rush in the city of your choice. New stations open as the shift unfolds.",
    daily:
      "Everyone starts with the same city and seed for the UTC date. Replay the shift to beat your own ticket.",
    easy: "An untimed run with slower demand. Riders wait patiently. End your shift whenever you like.",
  };
  function choose() {
    const { s } = get();
    let mode = s.mode,
      city = s.city;
    section("Choose a shift");
    const options = el("div", undefined, "form-options");
    body.append(options);
    const desc = el("p");
    desc.style.marginTop = "10px";
    body.append(desc);
    body.append(el("strong", "City", "field-label"));
    const cities = el("div", undefined, "form-options"),
      detail = el("p");
    body.append(cities, detail);
    const modes = Object.keys(MODES).map((k) =>
      button(options, MODES[k], () => {
        mode = k;
        update();
      }),
    );
    const picks = CITIES.map((c, i) =>
      button(cities, c.name, () => {
        city = i;
        update();
      }),
    );
    const calendar = dailyPlan();
    function update() {
      const selected = mode === "daily" ? calendar.city : city;
      desc.textContent = descriptions[mode];
      modes.forEach((b, i) =>
        b.setAttribute("aria-pressed", String(Object.keys(MODES)[i] === mode)),
      );
      picks.forEach((b, i) => {
        b.setAttribute("aria-pressed", String(i === selected));
        b.disabled = mode === "daily";
      });
      detail.textContent =
        mode === "daily"
          ? "Timetable for " + calendar.date + " UTC · " + CITIES[selected].name
          : "";
    }
    update();
    if (s.phase !== "ready" && s.phase !== "done")
      p(
        "Opening a new shift replaces your current run. Previously earned tickets stay on this device.",
      );
    actions(
      ["Back", () => close()],
      [
        "Open new shift",
        () =>
          begin(
            mode,
            mode === "daily" ? calendar.city : city,
            mode === "daily" ? calendar.date : "",
          ),
        "primary",
      ],
    );
  }
  function receipt() {
    const { s, book } = get(),
      pts = score(s),
      best = book.bests.find((b) => b.key === recordKey(s));
    section("Shift ticket");
    body.append(el("div", medal(s), "result-ticket"));
    p(
      CITIES[s.city].name +
        " · " +
        MODES[s.mode] +
        (s.mode === "daily" ? " · " + s.date + " UTC" : ""),
    );
    const grid = el("div", undefined, "results");
    for (const [label, v] of [
      ["Score", pts],
      ["Delivered", s.served],
      ["Transfer journeys", s.through],
      ["Calls completed", s.ordersWon],
      ["Still travelling", waiting(s) + aboard(s)],
      ["Walked away", s.missed],
    ]) {
      const cell = el("div");
      cell.append(el("b", v), el("small", label));
      grid.append(cell);
    }
    body.append(grid);
    const next = [220, 480, 800].find((n) => n > pts);
    p(
      "Personal best: " +
        (best?.score ?? pts) +
        " points." +
        (next ? " Next ticket at " + next + "." : " All ticket tiers reached."),
    );
    actions(
      ["Choose another shift", choose],
      ["Replay timetable", retry, "primary"],
    );
  }
  function dispatch() {
    const { s } = get(),
      station = CITIES[s.city].stations;
    section("Dispatch call");
    if (s.order) {
      const o = s.order,
        name = station[o.target].name;
      heading((o.won ? "Completed · " : "Priority stop · ") + name);
      p(
        o.won
          ? "Your fleet now has " + seats(s) + " seats per train."
          : "Deliver " +
              (o.goal - o.count) +
              " more to " +
              name +
              " in " +
              Math.max(0, Math.ceil((o.due - s.clock) / 5)) +
              " seconds of running time.",
      );
      p(
        "Share a stop between lines so passengers from across town can reach the destination.",
      );
      actions([
        "Locate " + name,
        () => {
          close();
          pick(o.target);
        },
        "primary",
      ]);
    } else {
      const lonely = station
        .slice(0, s.open)
        .findIndex((_, i) => !s.routes.some((r) => r.includes(i)));
      if (lonely >= 0) {
        heading("Connect " + station[lonely].name);
        p(
          "Link this station to an existing line. Trains pick up people automatically when the next stop takes them closer to their destination.",
        );
        actions([
          "Locate station",
          () => {
            close();
            pick(lonely);
          },
          "primary",
        ]);
      } else {
        heading("All stations connected");
        p(
          "Check the busiest queues. Shorten a route, share a transfer station or send Green Wave to move riders sooner.",
        );
        actions(["Back to map", () => close(), "primary"]);
      }
    }
  }
  function conflict() {
    section("A newer shift was saved");
    p(
      "Another tab updated the game on this device. Load its latest shift to continue saving here.",
    );
    actions(["Load latest shift", reload, "primary"]);
  }
  return {
    help,
    install,
    settings,
    choose,
    receipt,
    stationList,
    dispatch,
    conflict,
  };
}
