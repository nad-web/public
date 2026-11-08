/* Scoped local records; no accounts or remote database. Noorullah Adel, 2026. MIT. */
export function createStorage(backend, key, validate) {
  let baseline = null,
    broken = false;
  function load() {
    try {
      baseline = backend?.getItem(key) ?? null;
      if (baseline === null) {
        broken = false;
        return { state: null };
      }
      try {
        const state = validate(JSON.parse(baseline));
        broken = false;
        return { state };
      } catch (error) {
        broken = true;
        return { state: null, error: "invalid", message: error.message };
      }
    } catch {
      return { state: null, error: "unavailable" };
    }
  }
  function write(state, { replaceBroken = false } = {}) {
    if (broken && !replaceBroken) return { ok: false, reason: "invalid" };
    try {
      if (!backend) return { ok: false, reason: "unavailable" };
      const fresh = backend.getItem(key);
      if (fresh !== baseline) return { ok: false, reason: "conflict" };
      const serialized = JSON.stringify(state);
      backend.setItem(key, serialized);
      baseline = serialized;
      broken = false;
      return { ok: true };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }
  return {
    load,
    write,
    get raw() {
      return baseline;
    },
    get broken() {
      return broken;
    },
    get key() {
      return key;
    },
  };
}
