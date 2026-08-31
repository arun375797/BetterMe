const store = new Map();

export function memoGet(key, ttlMs, fn) {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.exp > now) return hit.value;

  const value = Promise.resolve()
    .then(fn)
    .catch((error) => {
      const current = store.get(key);
      if (current?.value === value) store.delete(key);
      throw error;
    });

  store.set(key, { exp: now + ttlMs, value });
  return value;
}

export function memoClear(match) {
  if (!match) {
    store.clear();
    return;
  }
  for (const key of [...store.keys()]) {
    if (key.includes(match)) store.delete(key);
  }
}
