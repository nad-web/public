/* Original synthesized fish chimes. Copyright (c) 2026 Noorullah Adel. MIT. */
export function createAudio(platform = globalThis) {
  let context,
    master,
    enabled = false;
  const active = new Set();
  function silence() {
    for (const note of active)
      try {
        note.stop();
      } catch {}
    active.clear();
    if (context && master) master.gain.setValueAtTime(0, context.currentTime);
  }
  return {
    setEnabled(value) {
      enabled = value === true;
      if (!enabled) silence();
      if (master && context)
        master.gain.setValueAtTime(enabled ? 0.09 : 0, context.currentTime);
    },
    async unlock() {
      if (!enabled) return false;
      try {
        const Audio = platform.AudioContext || platform.webkitAudioContext;
        if (!Audio) return false;
        if (!context || context.state === "closed") {
          context = new Audio();
          master = context.createGain();
          master.connect(context.destination);
        }
        if (context.state !== "running") await context.resume();
        master.gain.setValueAtTime(enabled ? 0.09 : 0, context.currentTime);
        return enabled && context.state === "running";
      } catch {
        return false;
      }
    },
    fish(gold = false) {
      if (!enabled || !context || context.state !== "running") return false;
      const now = context.currentTime;
      for (const [i, frequency] of (gold
        ? [659.25, 830.61, 1046.5]
        : [659.25, 880]
      ).entries()) {
        const note = context.createOscillator(),
          gain = context.createGain();
        note.type = "sine";
        note.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.001, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.65, now + i * 0.055 + 0.009);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.16);
        note.connect(gain);
        gain.connect(master);
        active.add(note);
        note.onended = () => {
          active.delete(note);
          note.disconnect();
          gain.disconnect();
        };
        note.start(now + i * 0.055);
        note.stop(now + i * 0.055 + 0.18);
      }
      return true;
    },
    quiet: silence,
    async suspend() {
      silence();
      try {
        if (context?.state === "running") await context.suspend();
      } catch {}
    },
    get enabled() {
      return enabled;
    },
  };
}
