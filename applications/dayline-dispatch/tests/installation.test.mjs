import test from "node:test";
import assert from "node:assert/strict";
import { initPWA } from "../src/pwa.js";

test("the installation panel offers an update only for a replacement waiting behind an active worker", async (t) => {
  const controls = new Map();
  const ui = (id) => {
    if (!controls.has(id))
      controls.set(
        id,
        Object.assign(new EventTarget(), {
          hidden: true,
          parentElement: { dataset: {} },
        }),
      );
    return controls.get(id);
  };
  const first = Object.assign(new EventTarget(), {
    state: "installing",
    postMessage(_, ports) {
      ports[0].postMessage({ ready: true });
      ports[0].close();
    },
  });
  const registration = Object.assign(new EventTarget(), {
    installing: first,
    active: null,
    waiting: null,
  });
  const sw = Object.assign(new EventTarget(), {
    register: async () => registration,
  });
  for (const [key, value] of Object.entries({
    window: Object.assign(new EventTarget(), { isSecureContext: true }),
    navigator: { serviceWorker: sw },
    document: { getElementById: ui },
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
  initPWA({ onInstallGuide: () => {} });
  await new Promise((resolve) => setImmediate(resolve));
  registration.waiting = first;
  first.state = "installed";
  first.dispatchEvent(new Event("statechange"));
  assert(ui("update-button").hidden);
  registration.active = first;
  registration.waiting = null;
  first.state = "activated";
  first.dispatchEvent(new Event("statechange"));
  assert(ui("update-button").hidden);
  const next = new EventTarget();
  registration.installing = next;
  registration.dispatchEvent(new Event("updatefound"));
  registration.waiting = next;
  next.state = "installed";
  next.dispatchEvent(new Event("statechange"));
  assert.equal(ui("update-button").hidden, false);
  registration.waiting = null;
  sw.dispatchEvent(new Event("controllerchange"));
  assert(ui("update-button").hidden);
});
