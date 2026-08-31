import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LearningHome from "./pages/LearningHome.jsx";
import SubjectHub from "./pages/SubjectHub.jsx";
import SubjectPage from "./pages/SubjectPage.jsx";
import TopicDetail from "./pages/TopicDetail.jsx";
import NotebookPage from "./pages/NotebookPage.jsx";
import QuestionsPage from "./pages/QuestionsPage.jsx";
import QuestionViewPage from "./pages/QuestionViewPage.jsx";
import SugarPage from "./pages/SugarPage.jsx";
import VitaminPage from "./pages/VitaminPage.jsx";
import FoodPage from "./pages/FoodPage.jsx";
import RecipePage from "./pages/RecipePage.jsx";
import HealthHomePage from "./pages/HealthHomePage.jsx";
import HealthSoonPage from "./pages/HealthSoonPage.jsx";
import ExercisePage from "./pages/ExercisePage.jsx";
import ExerciseKindPage from "./pages/ExerciseKindPage.jsx";
import MyNotebooksHome from "./pages/MyNotebooksHome.jsx";
import NotebookBookIndex from "./pages/NotebookBookIndex.jsx";
import NotebookBookWrite from "./pages/NotebookBookWrite.jsx";
import PersonalityBooksPage from "./pages/PersonalityBooksPage.jsx";
import PersonalitySectionPage from "./pages/PersonalitySectionPage.jsx";
import PersonalityItemPage from "./pages/PersonalityItemPage.jsx";

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
      </Route>
    </Routes>
  );
}
