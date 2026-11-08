import test from "node:test";
import assert from "node:assert/strict";
import { requestNative } from "../src/fullscreen.js";
test("unsupported/disabled native fullscreen returns false so viewport play can remain available", async () => {
  assert.equal(await requestNative({ documentElement: {} }), false);
  let called = 0;
  assert.equal(
    await requestNative({
      documentElement: {
        requestFullscreen() {
          called++;
        },
      },
      fullscreenEnabled: false,
    }),
    false,
  );
  assert.equal(called, 0);
});
test("native fullscreen is requested with navigation hidden and actual returned state decides success", async () => {
  const d = {
    fullscreenElement: null,
    fullscreenEnabled: true,
    documentElement: {
      async requestFullscreen(options) {
        assert.equal(options.navigationUI, "hide");
        d.fullscreenElement = d.documentElement;
      },
    },
  };
  assert.equal(await requestNative(d), true);
  assert.equal(await requestNative(d), true);
});
test("denied fullscreen is handled without rejecting the gameplay flow", async () => {
  const d = {
    fullscreenElement: null,
    documentElement: {
      async requestFullscreen() {
        throw Error("NotAllowedError");
      },
    },
  };
  assert.equal(await requestNative(d), false);
  assert.equal(
    await requestNative({ documentElement: { async requestFullscreen() {} } }),
    false,
  );
});
