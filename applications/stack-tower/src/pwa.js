/* App-scoped offline setup and installation. Noorullah Adel, 2026. MIT. */
export function initPWA({
  onInstallGuide,
  beforeUpdate = () => {},
  notify = () => {},
}) {
  const status = document.getElementById("offline-status"),
    retry = document.getElementById("retry-offline"),
    update = document.getElementById("update-button"),
    native = document.getElementById("native-install"),
    scope = new URL("../", import.meta.url);
  let registration,
    installPrompt,
    updating = false;
  function report(message, ready = false) {
    status.textContent = message;
    status.parentElement.dataset.ready = String(ready);
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e;
    native.hidden = false;
  });
  native.addEventListener("click", async () => {
    if (!installPrompt) return;
    try {
      const prompt = installPrompt;
      installPrompt = null;
      native.hidden = true;
      await prompt.prompt();
    } catch {
      notify("Use your browser’s install menu to add the game.");
    }
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    native.hidden = true;
    notify("Game installed. Open the new icon online once to save its files.");
  });
  document
    .getElementById("install-button")
    .addEventListener("click", onInstallGuide);
  function query(worker, type = "CHECK_READY") {
    return new Promise((resolve) => {
      const channel = new MessageChannel(),
        timer = setTimeout(() => {
          channel.port1.close();
          resolve({ ready: false });
        }, 6500);
      channel.port1.onmessage = (e) => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(e.data || { ready: false });
      };
      try {
        worker.postMessage({ type }, [channel.port2]);
      } catch {
        clearTimeout(timer);
        channel.port1.close();
        resolve({ ready: false });
      }
    });
  }
  async function check(repair = false) {
    if (!window.isSecureContext || !("serviceWorker" in navigator)) {
      report("Offline setup needs HTTPS or a supported browser.");
      retry.hidden = true;
      return;
    }
    if (!registration) {
      report("Offline setup is unavailable. Connect and try again.");
      retry.hidden = false;
      return;
    }
    if (!registration?.active) {
      report("Saving the game for offline play…");
      return;
    }
    if (repair) report("Checking and saving game files…");
    const result = await query(
      registration.active,
      repair ? "REPAIR_CACHE" : "CHECK_READY",
    );
    report(
      result.ready
        ? "Ready for offline play"
        : "Offline setup incomplete. Open online and try again.",
      result.ready === true,
    );
    retry.hidden = result.ready === true;
  }
  function offerUpdate() {
    if (registration?.waiting) update.hidden = false;
  }
  function observe() {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "activated") check();
      if (worker.state === "installed") {
        offerUpdate();
        if (!registration.active) report("Finishing offline setup…");
      }
      if (worker.state === "redundant") {
        report("Could not save all files. Try again while online.");
        retry.hidden = false;
      }
    });
  }
  update.addEventListener("click", () => {
    if (!registration?.waiting || updating) return;
    updating = true;
    beforeUpdate();
    update.disabled = true;
    update.textContent = "Updating…";
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  });
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (updating) location.reload();
    else check();
  });
  retry.addEventListener("click", async () => {
    retry.disabled = true;
    try {
      if (!registration) await start();
      else {
        await registration.update();
        await check(true);
      }
    } catch {
      report("Connect to the internet, then try again.");
    } finally {
      retry.disabled = false;
    }
  });
  async function start() {
    if (!window.isSecureContext || !("serviceWorker" in navigator)) {
      report("Offline setup needs HTTPS or a supported browser.");
      retry.hidden = true;
      return;
    }
    try {
      registration = await navigator.serviceWorker.register(
        new URL("sw.js", scope),
        { scope: scope.href, updateViaCache: "none" },
      );
      observe();
      registration.addEventListener("updatefound", observe);
      offerUpdate();
      await check();
    } catch {
      report("Could not save the game offline. Connect and try again.");
      retry.hidden = false;
    }
  }
  window.addEventListener("online", () => {
    check();
    registration?.update().catch(() => {});
  });
  start();
  return { check };
}
