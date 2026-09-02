import {
  getBookIndex,
  getBookPage,
  getBooks,
  getExerciseSessions,
  getFoodItem,
  getFoodItems,
  getMealLogs,
  getNamasteDev,
  getPersonalityItem,
  getPersonalityItems,
  getQuestion,
  getQuestions,
  getReviewQueue,
  getSubject,
  getSubjects,
  getSugarReadings,
  getSleepLogs,
  getReportStats,
  getSitBreakVideos,
  getMusicTracks,
  getTopic,
  getVitaminItems,
  getTodos,
  getStudyPlan,
} from "./api.js";

const lastAt = new Map();
const THROTTLE_MS = 700;

function quiet(promise) {
  return Promise.resolve(promise).catch(() => {});
}

function pageLoaders(pathname) {
  if (pathname === "/" || pathname === "/today") {
    return () => import("./pages/TodayPage.jsx");
  }
  if (pathname === "/learning") return () => import("./pages/LearningHome.jsx");
  if (/^\/learning\/[^/]+$/.test(pathname)) {
    return () => import("./pages/SubjectHub.jsx");
  }
  if (pathname === "/learning/dsa/namaste-dev") {
    return () => import("./pages/NamasteDevPage.jsx");
  }
  if (/^\/learning\/[^/]+\/(theory|practical)$/.test(pathname)) {
    return () => import("./pages/SubjectPage.jsx");
  }
  if (/^\/learning\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(pathname)) {
    return () => import("./pages/QuestionViewPage.jsx");
  }
  if (/^\/learning\/[^/]+\/practical\/[^/]+\/[^/]+$/.test(pathname)) {
    return () => import("./pages/QuestionsPage.jsx");
  }
  if (/^\/learning\/[^/]+\/theory\/[^/]+\/[^/]+$/.test(pathname)) {
    return () => import("./pages/NotebookPage.jsx");
  }
  if (/^\/learning\/[^/]+\/[^/]+\/[^/]+$/.test(pathname)) {
    return () => import("./pages/TopicDetail.jsx");
  }
  if (pathname === "/health") return () => import("./pages/HealthHomePage.jsx");
  if (pathname === "/health/sugar") return () => import("./pages/SugarPage.jsx");
  if (pathname === "/health/vitamin") {
    return () => import("./pages/VitaminPage.jsx");
  }
  if (pathname === "/health/food") return () => import("./pages/FoodPage.jsx");
  if (/^\/health\/food\/[^/]+$/.test(pathname)) {
    return () => import("./pages/RecipePage.jsx");
  }
  if (pathname === "/health/exercise") {
    return () => import("./pages/ExercisePage.jsx");
  }
  if (/^\/health\/exercise\/[^/]+$/.test(pathname)) {
    return () => import("./pages/ExerciseKindPage.jsx");
  }
  if (pathname === "/health/sleep") return () => import("./pages/SleepPage.jsx");
  if (pathname === "/notebooks") {
    return () => import("./pages/MyNotebooksHome.jsx");
  }
  if (/^\/notebooks\/[^/]+$/.test(pathname)) {
    return () => import("./pages/NotebookBookIndex.jsx");
  }
  if (/^\/notebooks\/[^/]+\/pages\/[^/]+$/.test(pathname)) {
    return () => import("./pages/NotebookBookWrite.jsx");
  }
  if (pathname === "/personality/books") {
    return () => import("./pages/PersonalityBooksPage.jsx");
  }
  if (/^\/personality\/[^/]+\/[^/]+$/.test(pathname)) {
    return () => import("./pages/PersonalityItemPage.jsx");
  }
  if (/^\/personality\/[^/]+$/.test(pathname)) {
    return () => import("./pages/PersonalitySectionPage.jsx");
  }
  if (pathname === "/report/statistics") {
    return () => import("./pages/ReportStatsPage.jsx");
  }
  if (pathname === "/sit25" || pathname === "/sit25/define") {
    return () =>
      Promise.all([
        import("./pages/Sit25Layout.jsx"),
        pathname === "/sit25/define"
          ? import("./pages/Sit25DefinePage.jsx")
          : import("./pages/Sit25BreakPage.jsx"),
      ]);
  }
  if (pathname === "/music") return () => import("./pages/MusicPage.jsx");
  return null;
}

function dataPrefetch(pathname) {
  if (pathname === "/" || pathname === "/today") {
    return [
      getTodos({ done: false }),
      getReviewQueue(),
      getVitaminItems(),
      getMealLogs(),
      getSugarReadings(),
      getSleepLogs(),
      getExerciseSessions(),
      getPersonalityItems(),
      getStudyPlan(),
    ];
  }
  if (pathname === "/learning") {
    return [getSubjects(), getReviewQueue(), getStudyPlan()];
  }

  const learning = pathname.match(
    /^\/learning\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?$/
  );
  if (learning) {
    const [, slug, section, topicId, subId, questionId] = learning;
    if (!section) return [getSubjects()];
    if (section === "namaste-dev") return [getNamasteDev()];
    if (!topicId) return [getSubject(slug, section)];
    if (!subId) return [getTopic(topicId)];
    const hostId = subId === "answer" ? topicId : subId;
    if (!questionId) {
      const jobs = [getTopic(hostId)];
      if (section === "practical") jobs.push(getQuestions(hostId));
      return jobs;
    }
    return [getTopic(hostId), getQuestion(questionId)];
  }

  if (pathname === "/health") {
    return [getSugarReadings(), getMealLogs(), getSleepLogs()];
  }
  if (pathname === "/health/sugar") return [getSugarReadings()];
  if (pathname === "/health/vitamin") return [getVitaminItems()];
  if (pathname === "/health/food") return [getFoodItems(), getMealLogs()];
  const food = pathname.match(/^\/health\/food\/([^/]+)$/);
  if (food) return [getFoodItem(food[1])];
  if (pathname === "/health/exercise") return [getExerciseSessions()];
  const kind = pathname.match(/^\/health\/exercise\/([^/]+)$/);
  if (kind) return [getExerciseSessions(kind[1])];
  if (pathname === "/health/sleep") return [getSleepLogs()];

  if (pathname === "/report/statistics") return [getReportStats()];
  if (pathname === "/sit25" || pathname === "/sit25/define") {
    return [getSitBreakVideos()];
  }
  if (pathname === "/music") return [getMusicTracks()];

  if (pathname === "/notebooks") return [getBooks()];
  const bookIndex = pathname.match(/^\/notebooks\/([^/]+)$/);
  if (bookIndex) return [getBookIndex(bookIndex[1])];
  const bookPage = pathname.match(/^\/notebooks\/([^/]+)\/pages\/([^/]+)$/);
  if (bookPage) return [getBookPage(bookPage[1], bookPage[2])];

  if (pathname === "/personality/books") {
    return [getPersonalityItems("books")];
  }
  const personalityItem = pathname.match(/^\/personality\/([^/]+)\/([^/]+)$/);
  if (personalityItem) return [getPersonalityItem(personalityItem[2])];
  const personality = pathname.match(/^\/personality\/([^/]+)$/);
  if (personality) return [getPersonalityItems(personality[1])];

  return [];
}

export function prefetchPath(pathname) {
  const path = String(pathname || "").replace(/\/$/, "") || "/";
  const now = Date.now();
  const prev = lastAt.get(path) || 0;
  if (now - prev < THROTTLE_MS) return;
  lastAt.set(path, now);

  const loader = pageLoaders(path);
  if (loader) quiet(loader());
  for (const job of dataPrefetch(path)) quiet(job);
}
