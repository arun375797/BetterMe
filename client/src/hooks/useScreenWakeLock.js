import { useEffect, useRef, useState } from "react";
import { keepScreenAwake } from "../lib/screenWakeLock.js";

export default function useScreenWakeLock(enabled) {
  const [status, setStatus] = useState("idle");
  const controller = useRef(null);
  useEffect(() => {
    if (!enabled) { setStatus("idle"); return; }
    const next = keepScreenAwake({ navigator, document, onStatus: setStatus });
    controller.current = next;
    return () => { next.dispose(); controller.current = null; };
  }, [enabled]);
  return { status: enabled ? status : "idle", retry: () => controller.current?.retry() };
}
