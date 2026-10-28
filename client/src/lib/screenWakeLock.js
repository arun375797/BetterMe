// One controller per running timer. Requests can resolve after the timer stops.
export function keepScreenAwake({ navigator, document, onStatus }) {
  let disposed = false;
  let pending = false;
  let lock = null;
  const supported = typeof navigator?.wakeLock?.request === "function";

  function release(sentinel) {
    try { Promise.resolve(sentinel.release()).catch(() => {}); }
    catch { /* The browser may already have released this lock. */ }
  }

  async function acquire() {
    if (disposed || pending || lock) return;
    if (!supported) { onStatus("unsupported"); return; }
    if (document.visibilityState !== "visible") { onStatus("hidden"); return; }
    pending = true;
    onStatus("requesting");
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      if (disposed || document.visibilityState !== "visible") {
        release(sentinel);
        if (!disposed) onStatus("hidden");
        return;
      }
      if (sentinel.released) { onStatus("released"); return; }
      lock = sentinel;
      sentinel.addEventListener("release", () => {
        if (lock !== sentinel) return;
        lock = null;
        if (!disposed) onStatus(document.visibilityState === "visible" ? "released" : "hidden");
      }, { once: true });
      onStatus("active");
    } catch {
      if (!disposed) onStatus(document.visibilityState === "visible" ? "blocked" : "hidden");
    } finally { pending = false; }
  }

  function onVisibility() {
    if (document.visibilityState === "visible") acquire();
    else {
      const previous = lock;
      lock = null;
      if (previous) release(previous);
      onStatus("hidden");
    }
  }
  document.addEventListener("visibilitychange", onVisibility);
  acquire();
  return {
    retry: acquire,
    dispose() {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      const previous = lock;
      lock = null;
      if (previous) release(previous);
    },
  };
}
