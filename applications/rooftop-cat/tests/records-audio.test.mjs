import test from "node:test";
import assert from "node:assert/strict";
import { createRecords, validateRecord } from "../src/storage.js";
import { createAudio } from "../src/audio.js";
function platform() {
  const values = new Map([["other-app", "keep"]]);
  return {
    values,
    localStorage: {
      getItem: (k) => values.get(k) || null,
      setItem: (k, v) => values.set(k, v),
    },
  };
}
test("partial and final snapshots count each run and fish only once", () => {
  const p = platform(),
    s = createRecords({ platform: p });
  s.saveRun("one", { mode: "cozy", score: 50, fishCount: 2, distance: 10 });
  s.saveRun("one", { mode: "cozy", score: 50, fishCount: 2, distance: 10 });
  let r = s.saveRun("one", {
    mode: "cozy",
    score: 150,
    fishCount: 5,
    distance: 30,
  });
  assert.deepEqual(r.stats, { runs: 1, fish: 5, distance: 30 });
  r = s.saveRun("one", { mode: "cozy", score: 25, fishCount: 1, distance: 4 });
  assert.deepEqual(r.stats, { runs: 1, fish: 5, distance: 30 });
  assert.equal(r.best.cozy, 150);
  s.saveRun("two", { mode: "chase", score: 90, fishCount: 1, distance: 15 });
  assert.equal(createRecords({ platform: p }).read().stats.runs, 2);
});
test("preferences and daily bests persist; reset only affects Rooftop Cat", () => {
  const p = platform(),
    s = createRecords({ platform: p });
  s.preferences({ sound: true, sky: "moonlight", cat: "cloud" });
  s.saveRun("daily", {
    mode: "daily",
    date: "2026-11-07",
    score: 500,
    fishCount: 8,
    distance: 100,
  });
  const r = createRecords({ platform: p }).read();
  assert.equal(r.prefs.sound, true);
  assert.equal(r.best.daily["2026-11-07"], 500);
  assert.equal(r.best.cozy, 0);
  s.reset();
  assert.equal(s.read().stats.fish, 0);
  assert.equal(p.values.get("other-app"), "keep");
});
test("denied or full storage keeps this visit's data and warns once", () => {
  for (const denied of [true, false]) {
    const warning = [],
      p = platform();
    if (denied)
      Object.defineProperty(p, "localStorage", {
        get() {
          throw Error("denied");
        },
      });
    else
      p.localStorage.setItem = () => {
        throw Error("quota");
      };
    const s = createRecords({ platform: p, onWarning: (m) => warning.push(m) });
    s.preferences({ sound: true });
    s.saveRun("visit", { mode: "cozy", score: 42, fishCount: 2, distance: 4 });
    assert.equal(s.read().prefs.sound, true);
    assert.equal(s.read().best.cozy, 42);
    assert.equal(warning.length, 1);
  }
});
test("corrupted or future records cannot inject invalid settings or scores", () => {
  const r = validateRecord({
    version: 1,
    prefs: { sound: "true", sky: "bad", motion: false },
    best: { cozy: Infinity, chase: -3 },
    stats: { fish: NaN },
  });
  assert.equal(r.prefs.sound, false);
  assert.equal(r.prefs.sky, "sunset");
  assert.equal(r.prefs.motion, false);
  assert.equal(r.best.cozy, 0);
  assert.equal(r.best.chase, 0);
  assert.equal(r.stats.fish, 0);
  assert.equal(validateRecord({ version: 20 }).stats.runs, 0);
});
function audioPlatform() {
  const state = { created: 0, notes: [], master: [] };
  class Audio {
    constructor() {
      state.created++;
      this.state = "suspended";
      this.currentTime = 0;
      this.destination = {};
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: (v) => state.master.push(v),
          exponentialRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
    }
    createOscillator() {
      const n = {
        frequency: { setValueAtTime: (v) => (n.frequencyValue = v) },
        connect() {},
        disconnect() {},
        start() {
          n.started = true;
        },
        stop() {
          n.stops = (n.stops || 0) + 1;
        },
      };
      state.notes.push(n);
      return n;
    }
    async resume() {
      this.state = "running";
    }
    async suspend() {
      this.state = "suspended";
    }
  }
  return { AudioContext: Audio, state };
}
test("audio requires opt-in and a gesture-unlocked context; mute stops scheduled notes", async () => {
  const p = audioPlatform(),
    a = createAudio(p);
  assert.equal(await a.unlock(), false);
  assert.equal(p.state.created, 0);
  assert.equal(a.fish(), false);
  a.setEnabled(true);
  assert.equal(a.fish(), false);
  assert.equal(await a.unlock(), true);
  assert(a.fish());
  assert.equal(p.state.notes.length, 2);
  a.setEnabled(false);
  assert.equal(a.fish(), false);
  assert(p.state.notes.every((n) => n.stops >= 2));
  assert.equal(p.state.master.at(-1), 0);
});
test("sound resumes after pause and unsupported audio keeps gameplay silent", async () => {
  const p = audioPlatform(),
    a = createAudio(p);
  a.setEnabled(true);
  await a.unlock();
  await a.suspend();
  assert.equal(a.fish(), false);
  await a.unlock();
  assert.equal(p.state.master.at(-1), 0.09);
  assert(a.fish(true));
  assert.equal(p.state.notes.length, 3);
  const s = createAudio({});
  s.setEnabled(true);
  assert.equal(await s.unlock(), false);
  assert.equal(s.fish(), false);
});
