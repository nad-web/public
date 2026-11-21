/* Dayline Dispatch · Noorullah Adel · MIT. */
export async function toggleFullscreen(doc = document) {
  const root = doc.documentElement;
  try {
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      const leave = doc.exitFullscreen || doc.webkitExitFullscreen;
      if (leave) await leave.call(doc);
      return true;
    }
    const enter = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!enter) return false;
    await enter.call(root);
    return true;
  } catch {
    return false;
  }
}
