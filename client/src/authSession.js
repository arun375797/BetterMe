const KEY = "betterme-auth-v1";
export const AUTH_LOST = "betterme-auth-lost";

export function readSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.token || !Number.isFinite(data?.expiresAt)) return null;
    if (Date.now() >= data.expiresAt) {
      localStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveSession(data) {
  const expiresAt = Number(data.expiresAt);
  localStorage.setItem(
    KEY,
    JSON.stringify({
      token: data.token,
      expiresAt,
    })
  );
}

export function clearSession() {
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
