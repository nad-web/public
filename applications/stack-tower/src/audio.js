/* Original synthesized runner chimes. Noorullah Adel, 2026. MIT. */
export function createAudio(platform = globalThis) {
  let context,
    master,
    enabled = false;
  const active = new Set();
  function quiet() {
    for (const node of active)
      try {
        node.stop();
      } catch {}
    active.clear();
    if (context && master) master.gain.setValueAtTime(0, context.currentTime);
  }
  return {
    setEnabled(value) {
      enabled = value === true;
      if (!enabled) quiet();
      if (context && master)
        master.gain.setValueAtTime(enabled ? 0.055 : 0, context.currentTime);
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
        master.gain.setValueAtTime(enabled ? 0.055 : 0, context.currentTime);
        return enabled && context.state === "running";
      } catch {
        return false;
      }
    },
    play(kind = "jump") {
      if (!enabled || !context || context.state !== "running") return false;
      const notes = {
        jump: [420, 610],
        hit: [150, 105],
        milestone: [620, 780, 930],
        finish: [523.25, 659.25, 783.99, 1046.5],
        start: [520, 650],
      }[kind] || [520];
      notes.forEach((frequency, i) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain(),
          at = context.currentTime + i * 0.055;
        oscillator.type = kind === "hit" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.001, at);
        gain.gain.exponentialRampToValueAtTime(0.52, at + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.115);
        oscillator.connect(gain);
        gain.connect(master);
        active.add(oscillator);
        oscillator.onended = () => {
          active.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(at);
        oscillator.stop(at + 0.13);
      });
      return true;
    },
    quiet,
    async suspend() {
      quiet();
      try {
        if (context?.state === "running") await context.suspend();
      } catch {}
    },
    get enabled() {
      return enabled;
    },
  };
}
