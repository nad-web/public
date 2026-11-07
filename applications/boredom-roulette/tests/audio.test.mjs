import test from "node:test";
import assert from "node:assert/strict";
import { createAudio } from "../src/audio.js";
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
  assert.equal(a.play(), false);
  a.setEnabled(true);
  assert.equal(a.play(), false);
  assert.equal(await a.unlock(), true);
  assert(a.play());
  assert.equal(p.state.notes.length, 2);
  a.setEnabled(false);
  assert.equal(a.play(), false);
  assert(p.state.notes.every((n) => n.stops >= 2));
  assert.equal(p.state.master.at(-1), 0);
});
test("sound resumes after pause and unsupported audio keeps gameplay silent", async () => {
  const p = audioPlatform(),
    a = createAudio(p);
  a.setEnabled(true);
  await a.unlock();
  await a.suspend();
  assert.equal(a.play(), false);
  await a.unlock();
  assert.equal(p.state.master.at(-1), 0.09);
  assert(a.play("complete"));
  assert.equal(p.state.notes.length, 4);
  const s = createAudio({});
  s.setEnabled(true);
  assert.equal(await s.unlock(), false);
  assert.equal(s.play(), false);
});
