import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { AUTH_LOST, readSession } from "./authSession.js";
import LoginPage from "./pages/LoginPage.jsx";

const TodayPage = lazy(() => import("./pages/TodayPage.jsx"));
const LearningHome = lazy(() => import("./pages/LearningHome.jsx"));
const SubjectHub = lazy(() => import("./pages/SubjectHub.jsx"));
const SubjectPage = lazy(() => import("./pages/SubjectPage.jsx"));
const TopicDetail = lazy(() => import("./pages/TopicDetail.jsx"));
const NamasteDevPage = lazy(() => import("./pages/NamasteDevPage.jsx"));
const NotebookPage = lazy(() => import("./pages/NotebookPage.jsx"));
const QuestionsPage = lazy(() => import("./pages/QuestionsPage.jsx"));
const QuestionViewPage = lazy(() => import("./pages/QuestionViewPage.jsx"));
const SugarPage = lazy(() => import("./pages/SugarPage.jsx"));
const VitaminPage = lazy(() => import("./pages/VitaminPage.jsx"));
const FoodPage = lazy(() => import("./pages/FoodPage.jsx"));
const RecipePage = lazy(() => import("./pages/RecipePage.jsx"));
const HealthHomePage = lazy(() => import("./pages/HealthHomePage.jsx"));
const HealthSoonPage = lazy(() => import("./pages/HealthSoonPage.jsx"));
const ExercisePage = lazy(() => import("./pages/ExercisePage.jsx"));
const ExerciseKindPage = lazy(() => import("./pages/ExerciseKindPage.jsx"));
const SleepPage = lazy(() => import("./pages/SleepPage.jsx"));
const MyNotebooksHome = lazy(() => import("./pages/MyNotebooksHome.jsx"));
const NotebookBookIndex = lazy(() => import("./pages/NotebookBookIndex.jsx"));
const NotebookBookWrite = lazy(() => import("./pages/NotebookBookWrite.jsx"));
const PersonalityBooksPage = lazy(
  () => import("./pages/PersonalityBooksPage.jsx")
);
const PersonalitySectionPage = lazy(
  () => import("./pages/PersonalitySectionPage.jsx")
);
const PersonalityItemPage = lazy(
  () => import("./pages/PersonalityItemPage.jsx")
);
const TodoHome = lazy(() => import("./pages/TodoHome.jsx"));
const TodoCategoryPage = lazy(() => import("./pages/TodoCategoryPage.jsx"));
const ReportStatsPage = lazy(() => import("./pages/ReportStatsPage.jsx"));
const Sit25Layout = lazy(() => import("./pages/Sit25Layout.jsx"));
const Sit25BreakPage = lazy(() => import("./pages/Sit25BreakPage.jsx"));
const Sit25DefinePage = lazy(() => import("./pages/Sit25DefinePage.jsx"));
const MusicPage = lazy(() => import("./pages/MusicPage.jsx"));

function NestedTopicPage() {
  const { section } = useParams();
  return section === "practical" ? <QuestionsPage /> : <NotebookPage />;
}

function AuthGate({ children }) {
  const [session, setSession] = useState(() => readSession());

  useEffect(() => {
    function onLost() {
      setSession(null);
    }
    window.addEventListener(AUTH_LOST, onLost);
    const id = window.setInterval(() => {
      const next = readSession();
      setSession((prev) => {
        if (!next) return null;
        if (prev?.token === next.token) return prev;
        return next;
      });
    }, 15_000);
    return () => {
      window.removeEventListener(AUTH_LOST, onLost);
      window.clearInterval(id);
    };
  }, []);

  if (!session) {
    return <LoginPage onUnlocked={setSession} />;
  }
  return children;
}

export default function App() {
  return (
    <AuthGate>
      <Suspense fallback={<p className="page-pad text-muted">Loading…</p>}>
      <Routes>
        <Route path="/sit25" element={<Sit25Layout />}>
          <Route index element={<Sit25BreakPage />} />
          <Route path="define" element={<Sit25DefinePage />} />
        </Route>
        <Route path="/music" element={<MusicPage />} />
        <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/learning" element={<LearningHome />} />
        <Route path="/learning/:slug" element={<SubjectHub />} />
        <Route path="/learning/dsa/namaste-dev" element={<NamasteDevPage />} />
        <Route path="/learning/:slug/:section" element={<SubjectPage />} />
        <Route
          path="/learning/:slug/:section/:topicId"
          element={<TopicDetail />}
        />
        <Route
          path="/learning/:slug/:section/:topicId/answer/:questionId"
          element={<QuestionViewPage />}
        />
        <Route
          path="/learning/:slug/:section/:topicId/answer"
          element={<NestedTopicPage />}
        />
        <Route
          path="/learning/:slug/:section/:topicId/:subId/:questionId"
          element={<QuestionViewPage />}
        />
        <Route
          path="/learning/:slug/:section/:topicId/:subId"
          element={<NestedTopicPage />}
        />
        <Route path="/health" element={<HealthHomePage />} />
        <Route path="/health/sugar" element={<SugarPage />} />
        <Route path="/health/vitamin" element={<VitaminPage />} />
        <Route path="/health/food" element={<FoodPage />} />
        <Route path="/health/food/:foodId" element={<RecipePage />} />
        <Route path="/health/exercise" element={<ExercisePage />} />
        <Route path="/health/exercise/:kind" element={<ExerciseKindPage />} />
        <Route path="/health/sleep" element={<SleepPage />} />
        <Route path="/health/:item" element={<HealthSoonPage />} />
        <Route path="/notebooks" element={<MyNotebooksHome />} />
        <Route path="/notebooks/:bookId" element={<NotebookBookIndex />} />
        <Route
          path="/notebooks/:bookId/pages/:pageId"
          element={<NotebookBookWrite />}
        />
        <Route path="/personality/books" element={<PersonalityBooksPage />} />
        <Route
          path="/personality/:section/:itemId"
          element={<PersonalityItemPage />}
        />
        <Route
          path="/personality/:section"
          element={<PersonalitySectionPage />}
        />
        <Route path="/todos" element={<TodoHome />} />
        <Route
          path="/todos/category/:categoryId"
          element={<TodoCategoryPage />}
        />
        <Route path="/report" element={<Navigate to="/report/statistics" replace />} />
        <Route path="/report/statistics" element={<ReportStatsPage />} />
      </Route>
      </Routes>
      </Suspense>
    </AuthGate>
  );
}
