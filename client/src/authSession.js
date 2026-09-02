const KEY = "betterme-auth-v1";
export const AUTH_LOST = "betterme-auth-lost";
const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000;

let memory = null;

function ttlMs(data) {
  const fromApi = Number(data?.expiresInMs);
  if (Number.isFinite(fromApi) && fromApi > 0) return fromApi;
  const abs = Number(data?.expiresAt);
  if (Number.isFinite(abs)) {
    const remaining = abs - Date.now();
    if (remaining > 60_000) return remaining;
  }
  return DEFAULT_TTL_MS;
}

function normalize(data) {
  const token = String(data?.token || "");
  if (!token) return null;
  const expiresAt = Date.now() + ttlMs(data);
  return { token, expiresAt };
}

function stillValid(data) {
  if (!data?.token) return null;
  if (!Number.isFinite(data.expiresAt) || Date.now() >= data.expiresAt) {
    return null;
  }
  return data;
}

export function readSession() {
  const live = stillValid(memory);
  if (live) return live;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = stillValid(JSON.parse(raw));
    if (!stored) {
      localStorage.removeItem(KEY);
      memory = null;
      return null;
    }
    memory = stored;
    return stored;
  } catch {
    return stillValid(memory);
  }
}

export function saveSession(data) {
  const next = normalize(data);
  if (!next) return null;
  memory = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / blocked storage — keep the in-memory session */
  }
  return next;
}

export function clearSession() {
  memory = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function authLost() {
  clearSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_LOST));
  }
}

export function getAuthToken() {
  return readSession()?.token || "";
}
