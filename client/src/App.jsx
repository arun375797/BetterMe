import { lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout.jsx";

const LearningHome = lazy(() => import("./pages/LearningHome.jsx"));
const SubjectHub = lazy(() => import("./pages/SubjectHub.jsx"));
const SubjectPage = lazy(() => import("./pages/SubjectPage.jsx"));
const TopicDetail = lazy(() => import("./pages/TopicDetail.jsx"));
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

function NestedTopicPage() {
  const { section } = useParams();
  return section === "practical" ? <QuestionsPage /> : <NotebookPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/learning" replace />} />
        <Route path="/learning" element={<LearningHome />} />
        <Route path="/learning/:slug" element={<SubjectHub />} />
        <Route path="/learning/:slug/:section" element={<SubjectPage />} />
        <Route
          path="/learning/:slug/:section/:topicId"
          element={<TopicDetail />}
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
      </Route>
    </Routes>
  );
}
