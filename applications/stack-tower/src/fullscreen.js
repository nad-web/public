/* Viewport-sized play, with feature-detected fullscreen. Noorullah Adel, 2026. MIT. */
export async function requestNative(doc) {
  if (doc.fullscreenElement) return true;
  if (
    typeof doc.documentElement.requestFullscreen !== "function" ||
    doc.fullscreenEnabled === false
  )
    return false;
  try {
    await doc.documentElement.requestFullscreen({ navigationUI: "hide" });
    return !!doc.fullscreenElement;
  } catch {
    return false;
  }
}
export function createScreen({
  onExitNative = () => {},
  changed = () => {},
} = {}) {
  const view = document.getElementById("play-shell");
  let active = false,
    nativeWas = false;
  function resize() {
    document.documentElement.style.setProperty(
      "--play-height",
      `${Math.round(window.visualViewport?.height || innerHeight)}px`,
    );
    changed();
  }
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  document.addEventListener("fullscreenchange", () => {
    const now = !!document.fullscreenElement;
    if (nativeWas && !now && active) onExitNative();
    nativeWas = now;
    resize();
  });
  resize();
  return {
    get active() {
      return active;
    },
    enter() {
      active = true;
      view.hidden = false;
      document.body.classList.add("playing");
      resize();
      requestNative(document);
    },
    async leave() {
      active = false;
      document.body.classList.remove("playing");
      view.hidden = true;
      if (document.fullscreenElement)
        try {
          await document.exitFullscreen();
        } catch {}
      resize();
    },
    async toggle() {
      if (document.fullscreenElement)
        try {
          await document.exitFullscreen();
        } catch {}
      else return requestNative(document);
      return true;
    },
  };
}
