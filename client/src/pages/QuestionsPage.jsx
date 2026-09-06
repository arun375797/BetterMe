import { useEffect, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router-dom";
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  getQuestions,
  getTopic,
  peekQuestions,
  peekTopic,
  updateQuestion,
  updateTopic,
} from "../api.js";
import QuestionFormModal from "../components/QuestionFormModal.jsx";
import StudyGoalsPanel from "../components/StudyGoalsPanel.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { difficultyMeta } from "../difficulty.js";
import { questionHasAnswer } from "../questions.js";
import { accentMap } from "../theme.jsx";

export default function QuestionsPage() {
  const { slug, section, topicId, subId } = useParams();
  const { refreshSubjects } = useOutletContext();
  const hostId = subId && subId !== "answer" ? subId : topicId;
  const onMainTopic = hostId === topicId;
  const [sub, setSub] = useState(() => peekTopic(hostId) || null);
  const [parent, setParent] = useState(
    () => peekTopic(hostId)?.parentTopic || null
  );
  const [questions, setQuestions] = useState(() => peekQuestions(hostId) || []);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function load() {
    try {
      const [topic, list] = await Promise.all([
        getTopic(hostId),
        getQuestions(hostId),
      ]);
      setSub(topic);
      setQuestions(list);
      if (topic.parentTopic?.subtopics) {
        setParent(topic.parentTopic);
      } else if (topic.parent || topic.parentTopic?._id) {
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
    const cached = peekTopic(hostId);
    const cachedQs = peekQuestions(hostId);
    if (cached) {
      setSub(cached);
      if (cached.parentTopic) setParent(cached.parentTopic);
    } else {
      setSub(null);
    }
    if (cachedQs) setQuestions(cachedQs);
    load();
  }, [hostId]);

  async function afterChange() {
    await load();
    await refreshSubjects();
  }

  async function addQuestion(values) {
    await createQuestion(hostId, values);
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

  async function toggleReview() {
    if (!sub) return;
    const next = !sub.inReview;
    setSub((prev) => (prev ? { ...prev, inReview: next } : prev));
    try {
      await updateTopic(hostId, { inReview: next });
      await refreshSubjects();
      setStatus(next ? "Marked for review" : "Removed from review");
      setTimeout(() => setStatus(""), 1800);
    } catch (err) {
      setStatus(err.message || "Could not update review");
    }
  }

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }

  if (section !== "practical") {
    const dest =
      subId && subId !== "answer"
        ? `/learning/${slug}/${section}/${topicId}/${subId}`
        : `/learning/${slug}/${section}/${topicId}/answer`;
    return <Navigate to={dest} replace />;
  }

  if (!sub) {
    return <p className="p-8 text-muted">Loading questions…</p>;
  }

  if (!sub.parent && !sub.parentTopic && !onMainTopic) {
    return (
      <Navigate to={`/learning/${slug}/${section}/${sub._id}`} replace />
    );
  }

  const accent = accentMap[sub.subject?.accent] || accentMap.gold;
  const parentTitle = parent?.title || sub.parentTopic?.title || "Topic";
  const siblingSections = onMainTopic
    ? sub.subtopics || []
    : parent?.subtopics || [];
  const missingAnswers = questions.filter((item) => !questionHasAnswer(item))
    .length;
  const questionPath = (id) =>
    onMainTopic
      ? `/learning/${slug}/${section}/${topicId}/answer/${id}`
      : `/learning/${slug}/${section}/${topicId}/${subId}/${id}`;

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad">
        <p className={`text-[12px] tracking-[0.18em] uppercase ${accent.text}`}>
          <Link to={`/learning/${slug}`} className="hover:underline">
            {sub.subject?.shortName || slug}
          </Link>
          {" · "}
          <Link to={`/learning/${slug}/${section}`} className="hover:underline">
            Practical
          </Link>
          {" · "}
          {onMainTopic ? (
            <Link
              to={`/learning/${slug}/${section}/${topicId}`}
              className="hover:underline"
            >
              {sub.title}
            </Link>
          ) : (
            <Link
              to={`/learning/${slug}/${section}/${topicId}`}
              className="hover:underline"
            >
              {parentTitle}
            </Link>
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold break-words sm:text-3xl">{sub.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {onMainTopic
                ? "Questions for this topic only. Each subtopic has a separate list. Open View to write the answer."
                : "Questions for this subtopic only. The parent topic has its own list."}{" "}
              A red dot means the answer is still missing.
            </p>
            {status ? (
              <p className="mt-1 text-xs text-teal">{status}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleReview}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium ${
                sub.inReview
                  ? "border-teal/50 bg-teal/20 text-teal"
                  : "border-white/15 bg-white/5 text-[#c8cfe0] hover:bg-white/10 hover:text-white"
              }`}
            >
              {sub.inReview ? "✓ In review" : "Add to review"}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#10201e]"
            >
              Add question
            </button>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {questions.length ? (
            questions.map((item, index) => (
              <li
                key={item._id}
                className="topic-row rounded-2xl border border-line bg-[#222838]/80 px-4 py-3"
              >
                <span className="topic-row-meta w-8 text-sm text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Link
                  to={questionPath(item._id)}
                  className="topic-row-title inline-flex items-start gap-2 font-medium hover:text-teal"
                >
                  {!questionHasAnswer(item) ? (
                    <span
                      className="missing-answer-dot mt-1.5"
                      title="No answer yet"
                      aria-label="No answer yet"
                    />
                  ) : null}
                  <span className="min-w-0 break-words">{item.title}</span>
                </Link>
                <span
                  className={`topic-row-meta rounded-full border px-2 py-0.5 text-[10px] ${
                    difficultyMeta(item.difficulty).className
                  }`}
                >
                  {difficultyMeta(item.difficulty).label}
                </span>
                <div className="topic-row-actions">
                <Link
                  to={questionPath(item._id)}
                  className="rounded-lg border border-teal/35 bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal hover:bg-teal/15"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const full = await getQuestion(item._id);
                      setEditItem(full);
                    } catch (err) {
                      setError(err.message);
                    }
                  }}
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
                </div>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-sm text-muted">
              No questions yet. Use Add question.
            </li>
          )}
        </ul>
      </section>

      <aside className="page-aside xl:sticky xl:top-0 xl:max-h-screen xl:overflow-y-auto">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          {onMainTopic ? "Topic" : "Subtopic"}
        </p>
        <h3 className="mt-2 text-lg font-semibold">{sub.title}</h3>
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Questions</span>
            <span className="text-teal">{questions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Missing answers</span>
            <span className={missingAnswers ? "text-coral" : "text-teal"}>
              {missingAnswers}
            </span>
          </div>
        </div>
        <StudyGoalsPanel slug={slug} section={section} />
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
