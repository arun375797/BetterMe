const RAILWAY_API = "https://betterme-production.up.railway.app";
const CACHE_TTL_MS = 2 * 60 * 1000;
const SESSION_KEY = "betterme-api-cache-v1";
const MAX_SESSION_ENTRY = 180_000;
const MAX_SESSION_TOTAL = 1_400_000;

function apiOrigin() {
  const fromEnv = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return RAILWAY_API;
  return "";
}

const API_ORIGIN = apiOrigin();

const mem = new Map();
const inflight = new Map();
let persistTimer = 0;

function cacheKey(base, path) {
  return `${base}${path}`;
}

function readSessionCache() {
  try {
    if (typeof sessionStorage === "undefined") return;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const now = Date.now();
    for (const [key, entry] of Object.entries(parsed || {})) {
      if (!entry?.data || now - entry.at > CACHE_TTL_MS * 3) continue;
      mem.set(key, { data: entry.data, at: entry.at });
    }
  } catch {
    /* ignore quota / parse */
  }
}

function persistSessionCache() {
  try {
    if (typeof sessionStorage === "undefined") return;
    const out = {};
    let total = 0;
    for (const [key, entry] of mem) {
      const encoded = JSON.stringify(entry.data);
      if (encoded.length > MAX_SESSION_ENTRY) continue;
      if (total + encoded.length > MAX_SESSION_TOTAL) continue;
      out[key] = { data: entry.data, at: entry.at };
      total += encoded.length;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(out));
  } catch {
    /* ignore quota */
  }
}

function schedulePersist() {
  if (typeof window === "undefined") return;
  if (persistTimer) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = 0;
    persistSessionCache();
  }, 250);
}

readSessionCache();

export function peek(base, path) {
  return mem.get(cacheKey(base, path))?.data;
}

function remember(key, data) {
  mem.set(key, { data, at: Date.now() });
  schedulePersist();
}

export function invalidateCache(prefixes) {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  for (const key of [...mem.keys()]) {
    if (list.some((prefix) => key.startsWith(prefix))) mem.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (list.some((prefix) => key.startsWith(prefix))) inflight.delete(key);
  }
  schedulePersist();
}

async function request(base, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (
    options.body != null &&
    !headers["Content-Type"] &&
    !headers["content-type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_ORIGIN}${base}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    const hint =
      import.meta.env.DEV
        ? "Backend may be offline or running old code — restart with npm run dev."
        : "Redeploy the frontend so it calls Railway.";
    throw new Error(`API did not return JSON. ${hint}`);
  }
  if (!res.ok) {
    throw new Error(body.message || "Request failed");
  }
  return body;
}

function get(base, path, ttl = CACHE_TTL_MS) {
  const key = cacheKey(base, path);
  const hit = mem.get(key);
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data);
  const pending = inflight.get(key);
  if (pending) return pending;

  const next = request(base, path)
    .then((data) => {
      remember(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, next);
  return next;
}

function mutate(base, path, options, prefixes) {
  return request(base, path, options).then((data) => {
    invalidateCache(prefixes);
    return data;
  });
}

const API = "/api/learning";
const SUGAR_API = "/api/sugar";
const VITAMIN_API = "/api/vitamins";
const FOOD_API = "/api/food";
const EXERCISE_API = "/api/exercise";
const BOOKS_API = "/api/notebooks";
const PERSONALITY_API = "/api/personality";
const TODOS_API = "/api/todos";
const SLEEP_API = "/api/sleep";
const REPORT_API = "/api/report";
const SIT_BREAK_API = "/api/sit-break";
const MUSIC_API = "/api/music";

const LEARNING = [API];
const SUGAR = [SUGAR_API];
const VITAMINS = [VITAMIN_API];
const FOOD = [FOOD_API];
const EXERCISE = [EXERCISE_API];
const BOOKS = [BOOKS_API];
const PERSONALITY = [PERSONALITY_API];
const TODOS = [TODOS_API];
const SLEEP = [SLEEP_API];
const REPORT = [REPORT_API];
const SIT_BREAK = [SIT_BREAK_API];
const MUSIC = [MUSIC_API];

export const peekSubjects = () => peek(API, "/subjects");
export const peekReviewQueue = () => peek(API, "/review");
export const peekSubject = (slug, section) => {
  const query = section ? `?section=${section}` : "";
  return peek(API, `/subjects/${slug}${query}`);
};
export const peekTopic = (id) => peek(API, `/topics/${id}`);
export const peekQuestions = (topicId) =>
  peek(API, `/topics/${topicId}/questions`);
export const peekBooks = () => peek(BOOKS_API, "/")?.books;

export const getSubjects = () => get(API, "/subjects");
export const getReviewQueue = () => get(API, "/review");
export const getSubject = (slug, section) => {
  const query = section ? `?section=${section}` : "";
  return get(API, `/subjects/${slug}${query}`);
};
export const getTopic = (id) => get(API, `/topics/${id}`);
export const createTopic = (data) =>
  mutate(API, "/topics", { method: "POST", body: JSON.stringify(data) }, LEARNING);
export const updateTopic = (id, data) =>
  mutate(
    API,
    `/topics/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    LEARNING
  );
export const deleteTopic = (id) =>
  mutate(API, `/topics/${id}`, { method: "DELETE" }, LEARNING);
export const getQuestions = (topicId) =>
  get(API, `/topics/${topicId}/questions`);
export const createQuestion = (topicId, data) =>
  mutate(
    API,
    `/topics/${topicId}/questions`,
    { method: "POST", body: JSON.stringify(data) },
    LEARNING
  );
export const getQuestion = (id) => get(API, `/questions/${id}`);
export const updateQuestion = (id, data) =>
  mutate(
    API,
    `/questions/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    LEARNING
  );
export const deleteQuestion = (id) =>
  mutate(API, `/questions/${id}`, { method: "DELETE" }, LEARNING);

export const getSugarReadings = () => get(SUGAR_API, "/");
export const createSugarReading = (data) =>
  mutate(SUGAR_API, "/", { method: "POST", body: JSON.stringify(data) }, [...SUGAR, ...REPORT]);
export const deleteSugarReading = (id) =>
  mutate(SUGAR_API, `/${id}`, { method: "DELETE" }, [...SUGAR, ...REPORT]);

export const getVitaminItems = () => get(VITAMIN_API, "/");
export const createVitaminItem = (data) =>
  mutate(
    VITAMIN_API,
    "/",
    { method: "POST", body: JSON.stringify(data) },
    VITAMINS
  );
export const updateVitaminItem = (id, data) =>
  mutate(
    VITAMIN_API,
    `/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    VITAMINS
  );
export const deleteVitaminItem = (id) =>
  mutate(VITAMIN_API, `/${id}`, { method: "DELETE" }, VITAMINS);

export const getFoodItems = () => get(FOOD_API, "/items");
export const getFoodItem = (id) => get(FOOD_API, `/items/${id}`);
export const createFoodItem = (data) =>
  mutate(FOOD_API, "/items", { method: "POST", body: JSON.stringify(data) }, FOOD);
export const updateFoodItem = (id, data) =>
  mutate(
    FOOD_API,
    `/items/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    FOOD
  );
export const deleteFoodItem = (id) =>
  mutate(FOOD_API, `/items/${id}`, { method: "DELETE" }, FOOD);
export const getMealLogs = () => get(FOOD_API, "/logs");
export const upsertMealLog = (data) =>
  mutate(FOOD_API, "/logs", { method: "POST", body: JSON.stringify(data) }, [...FOOD, ...REPORT]);
export const deleteMealLog = (id) =>
  mutate(FOOD_API, `/logs/${id}`, { method: "DELETE" }, [...FOOD, ...REPORT]);

export const getExerciseSessions = (kind) => {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return get(EXERCISE_API, `/${query}`);
};
export const createExerciseSession = (data) =>
  mutate(
    EXERCISE_API,
    "/",
    { method: "POST", body: JSON.stringify(data) },
    [...EXERCISE, ...REPORT]
  );
export const updateExerciseSession = (id, data) =>
  mutate(
    EXERCISE_API,
    `/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    [...EXERCISE, ...REPORT]
  );
export const deleteExerciseSession = (id) =>
  mutate(EXERCISE_API, `/${id}`, { method: "DELETE" }, [...EXERCISE, ...REPORT]);

export const getBooks = () => get(BOOKS_API, "/");
export const createBook = (data) =>
  mutate(BOOKS_API, "/", { method: "POST", body: JSON.stringify(data) }, BOOKS);
export const getBook = (bookId) => get(BOOKS_API, `/${bookId}`);
export const getBookIndex = (bookId) => get(BOOKS_API, `/${bookId}/index`);
export const updateBook = (bookId, data) =>
  mutate(
    BOOKS_API,
    `/${bookId}`,
    { method: "PATCH", body: JSON.stringify(data) },
    BOOKS
  );
export const deleteBook = (bookId) =>
  mutate(BOOKS_API, `/${bookId}`, { method: "DELETE" }, BOOKS);
export const createBookPage = (bookId, data = {}) =>
  mutate(
    BOOKS_API,
    `/${bookId}/pages`,
    { method: "POST", body: JSON.stringify(data) },
    BOOKS
  );
export const getBookPage = (bookId, pageId) =>
  get(BOOKS_API, `/${bookId}/pages/${pageId}`);
export const updateBookPage = (bookId, pageId, data) =>
  mutate(
    BOOKS_API,
    `/${bookId}/pages/${pageId}`,
    { method: "PATCH", body: JSON.stringify(data) },
    BOOKS
  );
export const deleteBookPage = (bookId, pageId) =>
  mutate(BOOKS_API, `/${bookId}/pages/${pageId}`, { method: "DELETE" }, BOOKS);

export const getPersonalityItems = (section) => {
  const query = section ? `?section=${encodeURIComponent(section)}` : "";
  return get(PERSONALITY_API, `/${query}`);
};
export const getPersonalityItem = (id) => get(PERSONALITY_API, `/${id}`);
export const createPersonalityItem = (data) =>
  mutate(
    PERSONALITY_API,
    "/",
    { method: "POST", body: JSON.stringify(data) },
    PERSONALITY
  );
export const updatePersonalityItem = (id, data) =>
  mutate(
    PERSONALITY_API,
    `/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    PERSONALITY
  );
export const deletePersonalityItem = (id) =>
  mutate(PERSONALITY_API, `/${id}`, { method: "DELETE" }, PERSONALITY);

export const peekTodoCategories = () =>
  peek(TODOS_API, "/categories")?.categories;

export const getTodoCategories = () => get(TODOS_API, "/categories");
export const createTodoCategory = (data) =>
  mutate(
    TODOS_API,
    "/categories",
    { method: "POST", body: JSON.stringify(data) },
    TODOS
  );
export const updateTodoCategory = (id, data) =>
  mutate(
    TODOS_API,
    `/categories/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    TODOS
  );
export const deleteTodoCategory = (id) =>
  mutate(TODOS_API, `/categories/${id}`, { method: "DELETE" }, TODOS);

export const getTodos = (filter = {}) => {
  const params = new URLSearchParams();
  if (filter.category != null) params.set("category", filter.category);
  if (filter.done != null) params.set("done", String(filter.done));
  const qs = params.toString() ? `?${params}` : "";
  return get(TODOS_API, `/${qs}`, 0);
};
export const createTodo = (data) =>
  mutate(
    TODOS_API,
    "/",
    { method: "POST", body: JSON.stringify(data) },
    TODOS
  );
export const updateTodo = (id, data) =>
  mutate(
    TODOS_API,
    `/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    TODOS
  );
export const deleteTodo = (id) =>
  mutate(TODOS_API, `/${id}`, { method: "DELETE" }, TODOS);

export const getSleepLogs = () => get(SLEEP_API, "/");
export const createSleepLog = (data) =>
  mutate(SLEEP_API, "/", { method: "POST", body: JSON.stringify(data) }, [...SLEEP, ...REPORT]);
export const updateSleepLog = (id, data) =>
  mutate(
    SLEEP_API,
    `/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    [...SLEEP, ...REPORT]
  );
export const deleteSleepLog = (id) =>
  mutate(SLEEP_API, `/${id}`, { method: "DELETE" }, [...SLEEP, ...REPORT]);

export const getReportStats = () => get(REPORT_API, "/stats");

export const peekSitBreakVideos = () => peek(SIT_BREAK_API, "/")?.videos;
export const getSitBreakVideos = () => get(SIT_BREAK_API, "/");
export const createSitBreakVideo = (data) =>
  mutate(
    SIT_BREAK_API,
    "/",
    { method: "POST", body: JSON.stringify(data) },
    SIT_BREAK
  );
export const updateSitBreakVideo = (id, data) =>
  mutate(
    SIT_BREAK_API,
    `/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    SIT_BREAK
  );
export const deleteSitBreakVideo = (id) =>
  mutate(SIT_BREAK_API, `/${id}`, { method: "DELETE" }, SIT_BREAK);

export const peekMusicTracks = () => peek(MUSIC_API, "/")?.tracks;
export const peekMusicCategories = () => peek(MUSIC_API, "/")?.categories;
export const getMusicTracks = () => get(MUSIC_API, "/");
export const createMusicTrack = (data) =>
  mutate(
    MUSIC_API,
    "/",
    { method: "POST", body: JSON.stringify(data) },
    MUSIC
  );
export const updateMusicTrack = (id, data) =>
  mutate(
    MUSIC_API,
    `/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    MUSIC
  );
export const deleteMusicTrack = (id) =>
  mutate(MUSIC_API, `/${id}`, { method: "DELETE" }, MUSIC);
export const createMusicCategory = (data) =>
  mutate(
    MUSIC_API,
    "/categories",
    { method: "POST", body: JSON.stringify(data) },
    MUSIC
  );
export const deleteMusicCategory = (id) =>
  mutate(MUSIC_API, `/categories/${id}`, { method: "DELETE" }, MUSIC);
