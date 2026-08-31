async function request(base, path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Request failed");
  }
  return res.json();
}

const API = "/api/learning";
const SUGAR_API = "/api/sugar";
const VITAMIN_API = "/api/vitamins";
const FOOD_API = "/api/food";
const EXERCISE_API = "/api/exercise";
const BOOKS_API = "/api/notebooks";
const PERSONALITY_API = "/api/personality";

export const getSubjects = () => request(API, "/subjects");
export const getReviewQueue = () => request(API, "/review");
export const getSubject = (slug, section) => {
  const query = section ? `?section=${section}` : "";
  return request(API, `/subjects/${slug}${query}`);
};
export const getTopic = (id) => request(API, `/topics/${id}`);
export const createTopic = (data) =>
  request(API, "/topics", { method: "POST", body: JSON.stringify(data) });
export const updateTopic = (id, data) =>
  request(API, `/topics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteTopic = (id) =>
  request(API, `/topics/${id}`, { method: "DELETE" });
export const getQuestions = (topicId) =>
  request(API, `/topics/${topicId}/questions`);
export const createQuestion = (topicId, data) =>
  request(API, `/topics/${topicId}/questions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const getQuestion = (id) => request(API, `/questions/${id}`);
export const updateQuestion = (id, data) =>
  request(API, `/questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteQuestion = (id) =>
  request(API, `/questions/${id}`, { method: "DELETE" });

export const getSugarReadings = () => request(SUGAR_API, "/");
export const createSugarReading = (data) =>
  request(SUGAR_API, "/", { method: "POST", body: JSON.stringify(data) });
export const deleteSugarReading = (id) =>
  request(SUGAR_API, `/${id}`, { method: "DELETE" });

export const getVitaminItems = () => request(VITAMIN_API, "/");
export const createVitaminItem = (data) =>
  request(VITAMIN_API, "/", { method: "POST", body: JSON.stringify(data) });
export const updateVitaminItem = (id, data) =>
  request(VITAMIN_API, `/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteVitaminItem = (id) =>
  request(VITAMIN_API, `/${id}`, { method: "DELETE" });

export const getFoodItems = () => request(FOOD_API, "/items");
export const getFoodItem = (id) => request(FOOD_API, `/items/${id}`);
export const createFoodItem = (data) =>
  request(FOOD_API, "/items", { method: "POST", body: JSON.stringify(data) });
export const updateFoodItem = (id, data) =>
  request(FOOD_API, `/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteFoodItem = (id) =>
  request(FOOD_API, `/items/${id}`, { method: "DELETE" });
export const getMealLogs = () => request(FOOD_API, "/logs");
export const upsertMealLog = (data) =>
  request(FOOD_API, "/logs", { method: "POST", body: JSON.stringify(data) });
export const deleteMealLog = (id) =>
  request(FOOD_API, `/logs/${id}`, { method: "DELETE" });

export const getExerciseSessions = (kind) => {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return request(EXERCISE_API, `/${query}`);
};
export const createExerciseSession = (data) =>
  request(EXERCISE_API, "/", { method: "POST", body: JSON.stringify(data) });
export const updateExerciseSession = (id, data) =>
  request(EXERCISE_API, `/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteExerciseSession = (id) =>
  request(EXERCISE_API, `/${id}`, { method: "DELETE" });

export const getBooks = () => request(BOOKS_API, "/");
export const createBook = (data) =>
  request(BOOKS_API, "/", { method: "POST", body: JSON.stringify(data) });
export const getBook = (bookId) => request(BOOKS_API, `/${bookId}`);
export const getBookIndex = (bookId) =>
  request(BOOKS_API, `/${bookId}/index`);
export const updateBook = (bookId, data) =>
  request(BOOKS_API, `/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteBook = (bookId) =>
  request(BOOKS_API, `/${bookId}`, { method: "DELETE" });
export const createBookPage = (bookId, data = {}) =>
  request(BOOKS_API, `/${bookId}/pages`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const getBookPage = (bookId, pageId) =>
  request(BOOKS_API, `/${bookId}/pages/${pageId}`);
export const updateBookPage = (bookId, pageId, data) =>
  request(BOOKS_API, `/${bookId}/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteBookPage = (bookId, pageId) =>
  request(BOOKS_API, `/${bookId}/pages/${pageId}`, { method: "DELETE" });

export const getPersonalityItems = (section) => {
  const query = section ? `?section=${encodeURIComponent(section)}` : "";
  return request(PERSONALITY_API, `/${query}`);
};
export const getPersonalityItem = (id) =>
  request(PERSONALITY_API, `/${id}`);
export const createPersonalityItem = (data) =>
  request(PERSONALITY_API, "/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updatePersonalityItem = (id, data) =>
  request(PERSONALITY_API, `/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deletePersonalityItem = (id) =>
  request(PERSONALITY_API, `/${id}`, { method: "DELETE" });
