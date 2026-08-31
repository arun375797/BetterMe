import { useEffect, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router-dom";
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  getTopic,
  updateQuestion,
} from "../api.js";
import QuestionFormModal from "../components/QuestionFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { difficultyMeta } from "../difficulty.js";
import { accentMap } from "../theme.jsx";

export default function QuestionsPage() {
  const { slug, section, topicId, subId } = useParams();
  const { refreshSubjects } = useOutletContext();
  const [sub, setSub] = useState(null);
  const [parent, setParent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function load() {
    try {
      const [topic, list] = await Promise.all([
        getTopic(subId),
        getQuestions(subId),
      ]);
      setSub(topic);
      setQuestions(list);
      if (topic.parent || topic.parentTopic?._id) {
        const parentData = await getTopic(
          topic.parentTopic?._id || topic.parent
        );
        setParent(parentData);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    setSub(null);
    load();
  }, [subId]);

  async function afterChange() {
    await load();
    await refreshSubjects();
  }

  async function addQuestion(values) {
    await createQuestion(subId, values);
    await afterChange();
  }

  async function saveQuestion(values) {
    await updateQuestion(editItem._id, values);
    await afterChange();
  }

  async function removeQuestion(item) {
    await deleteQuestion(item._id);
    await afterChange();
  }

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }

  if (!sub) {
    return <p className="p-8 text-muted">Loading questions…</p>;
  }

  if (!sub.parent && !sub.parentTopic) {
    return (
      <Navigate to={`/learning/${slug}/${section}/${sub._id}`} replace />
    );
  }

  const accent = accentMap[sub.subject?.accent] || accentMap.gold;
  const parentTitle = parent?.title || sub.parentTopic?.title || "Topic";
  const siblingSections = parent?.subtopics || [];

  return (
    <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[1fr_260px]">
      <section className="px-6 py-8 lg:px-8">
        <p className={`text-[12px] tracking-[0.18em] uppercase ${accent.text}`}>
          <Link to={`/learning/${slug}`} className="hover:underline">
            {sub.subject?.shortName || slug}
          </Link>
          {" · "}
          <Link to={`/learning/${slug}/${section}`} className="hover:underline">
            Practical
          </Link>
          {" · "}
          <Link
            to={`/learning/${slug}/${section}/${topicId}`}
            className="hover:underline"
          >
            {parentTitle}
          </Link>
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold">{sub.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Only the questions are listed here. Use View to open the
              answers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#10201e]"
          >
            Add question
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {questions.length ? (
            questions.map((item, index) => (
              <li
                key={item._id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-[#222838]/80 px-4 py-3"
              >
                <span className="w-8 text-sm text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Link
                  to={`/learning/${slug}/${section}/${topicId}/${subId}/${item._id}`}
                  className="min-w-0 flex-1 font-medium hover:text-teal"
                >
                  {item.title}
                </Link>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    difficultyMeta(item.difficulty).className
                  }`}
                >
                  {difficultyMeta(item.difficulty).label}
                </span>
                <Link
                  to={`/learning/${slug}/${section}/${topicId}/${subId}/${item._id}`}
                  className="rounded-lg border border-teal/35 bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal hover:bg-teal/15"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => setEditItem(item)}
                  className="rounded-lg border border-cyan/30 px-2.5 py-1 text-xs text-cyan hover:bg-cyan/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirm({
                      title: `Delete “${item.title}”?`,
                      message: "This question will be removed from this section.",
                      onConfirm: () => removeQuestion(item),
                    })
                  }
                  className="rounded-lg border border-coral/30 px-2.5 py-1 text-xs text-coral hover:bg-coral/10"
                >
                  Delete
                </button>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-sm text-muted">
              No questions yet. Use Add question.
            </li>
          )}
        </ul>
      </section>

      <aside className="border-l border-line/80 bg-[#171c2a]/70 px-6 py-8">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          Subtopic
        </p>
        <h3 className="mt-2 text-lg font-semibold">{sub.title}</h3>
        <div className="mt-6 flex justify-between text-sm">
          <span className="text-muted">Questions</span>
          <span className="text-teal">{questions.length}</span>
        </div>
      </aside>

      {addOpen ? (
        <QuestionFormModal
          heading="New question"
          submitLabel="Add question"
          sections={siblingSections}
          currentSectionId={sub._id}
          onClose={() => setAddOpen(false)}
          onSubmit={addQuestion}
        />
      ) : null}

      {editItem ? (
        <QuestionFormModal
          heading="Edit question"
          submitLabel="Save changes"
          initial={editItem}
          sections={siblingSections}
          currentSectionId={sub._id}
          onClose={() => setEditItem(null)}
          onSubmit={saveQuestion}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          kicker="Delete"
          title={confirm.title}
          message={confirm.message}
          onClose={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
        />
      ) : null}
    </div>
  );
}
