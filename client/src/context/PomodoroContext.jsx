import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPomodoroSessions, savePomodoroSession } from "../api.js";
import { advance, clock, dayKey, defaults } from "../lib/pomodoro.js";
import useScreenWakeLock from "../hooks/useScreenWakeLock.js";

const KEY = "betterme-pomodoro-v1";
const Context = createContext(null);
function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data && Array.isArray(data.sessions) && Array.isArray(data.pending)) return { ...data, settings: { ...defaults, ...data.settings } };
  } catch { /* Start safely if storage is unavailable or damaged. */ }
  return { settings: defaults, active: null, sessions: [], pending: [] };
}
export function PomodoroProvider({ children }) {
  const [data, setData] = useState(read);
  const current = useRef(data);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [loading, setLoading] = useState(true);
  const syncing = useRef(false);
  const location = useLocation();
  const [keepAwake, setKeepAwake] = useState(() => {
    try { return localStorage.getItem("betterme-pomodoro-keep-awake") !== "false"; }
    catch { return true; }
  });
  const wakeLock = useScreenWakeLock(keepAwake && data.active?.status === "running" &&
    data.active.updatedAt + data.active.plannedMs - data.active.elapsedMs > Date.now());
  function changeKeepAwake(enabled) {
    setKeepAwake(enabled);
    try { localStorage.setItem("betterme-pomodoro-keep-awake", String(enabled)); }
    catch { /* The preference still works for this visit. */ }
  }
  function commit(next) {
    current.current = next;
    setData(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); setStorageError(""); }
    catch { setStorageError("Browser storage is unavailable. Keep this page open until your sessions sync."); }
  }
  async function sync() {
    if (syncing.current) return;
    syncing.current = true;
    try {
      for (const id of [...current.current.pending]) {
        const row = current.current.sessions.find(s => s.sessionId === id);
        if (row) await savePomodoroSession(row);
        commit({ ...current.current, pending: current.current.pending.filter(item => item !== id) });
      }
      const remote = await getPomodoroSessions();
      const merged = new Map(remote.sessions.map(s => [s.sessionId, s]));
      // Keep local sessions if the GET raced with a newly finished session.
      for (const row of current.current.sessions) merged.set(row.sessionId, merged.get(row.sessionId) || row);
      commit({ ...current.current, sessions: [...merged.values()] });
      setError("");
    } catch (err) { setError(`Could not sync: ${err.message}. Sessions are kept on this browser; retry when connected.`); }
    finally { syncing.current = false; setLoading(false); }
  }
  useEffect(() => {
    sync();
    const timer = window.setInterval(() => {
      if (current.current.active && current.current.active.status !== "review") {
        commit({ ...current.current, active: advance(current.current.active) });
      }
    }, 500);
    const retry = window.setInterval(sync, 30000);
    function onStorage(event) {
      if (event.key === KEY) { const next = read(); current.current = next; setData(next); }
    }
    function onVisible() {
      if (document.visibilityState === "visible" && current.current.active) commit({ ...current.current, active: advance(current.current.active) });
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer); clearInterval(retry);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const active = data.active;
  useEffect(() => {
    if (!active) return;
    const original = document.title;
    document.title = `${active.status === "review" ? "Session ready to review" : `${clock(active.plannedMs - active.elapsedMs)} ${active.kind}`} · BetterMe`;
    return () => { document.title = original; };
  }, [active]);
  function start(kind, task) {
    if (current.current.active) return;
    const now = Date.now();
    commit({ ...current.current, active: {
      sessionId: crypto.randomUUID(), day: dayKey(), kind, task: task.trim().slice(0, 200),
      startedAt: now, updatedAt: now, plannedMs: current.current.settings[kind] * 60000,
      elapsedMs: 0, pausedMs: 0, status: "running", endedAt: null,
    } });
  }
  function togglePause() {
    const next = advance(current.current.active);
    if (!next || next.status === "review") return;
    commit({ ...current.current, active: { ...next, status: next.status === "paused" ? "running" : "paused" } });
  }
  function end() {
    const next = advance(current.current.active);
    if (next) commit({ ...current.current, active: { ...next, status: "review", endedAt: next.endedAt || Date.now() } });
  }
  function finish(distractedMs, note) {
    const row = current.current.active;
    if (!row || row.status !== "review") return;
    const session = {
      sessionId: row.sessionId, day: row.day, kind: row.kind, task: row.task,
      startedAt: row.startedAt, endedAt: row.endedAt, plannedMs: row.plannedMs,
      elapsedMs: Math.round(row.elapsedMs), pausedMs: Math.round(row.pausedMs),
      distractedMs: row.kind === "focus" ? Math.min(row.elapsedMs, Math.max(0, Math.round(distractedMs))) : 0,
      note: note.trim().slice(0, 1000), completed: row.elapsedMs === row.plannedMs,
    };
    commit({ ...current.current, active: null,
      sessions: [session, ...current.current.sessions.filter(s => s.sessionId !== session.sessionId)],
      pending: [...new Set([...current.current.pending, session.sessionId])],
    });
    sync();
  }
  function settings(next) {
    if (!["focus", "break", "goal"].every(key => Number.isInteger(next[key]) && next[key] >= 1 && next[key] <= (key === "goal" ? 30 : 180))) return;
    commit({ ...current.current, settings: next });
  }
  return <Context.Provider value={{ ...data, loading, error, storageError, sync, start, togglePause, end, finish, setSettings: settings, keepAwake, setKeepAwake: changeKeepAwake, wakeLock }}>
    {children}
    {active && location.pathname !== "/pomodoro" && <Link to="/pomodoro" role="status" className="fixed bottom-5 left-4 z-40 rounded-2xl border border-teal/40 bg-surface px-5 py-3 text-sm shadow-xl lg:left-auto lg:right-6">
      <span className="text-teal">Pomodoro · </span>{active.status === "review" ? "Review your session" : `${clock(active.plannedMs - active.elapsedMs)} · ${active.status === "paused" ? "Paused" : active.kind}`}<span className="ml-3 text-muted">Open →</span>
    </Link>}
  </Context.Provider>;
}
export const usePomodoro = () => useContext(Context);
