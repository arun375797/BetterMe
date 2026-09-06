import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  deleteQuestion,
  getQuestion,
  getTopic,
  peekTopic,
  updateQuestion,
  updateTopic,
} from "../api.js";
import QuestionFormModal from "../components/QuestionFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { difficultyMeta } from "../difficulty.js";
import { highlightCode } from "../notebook.js";
import { questionHasAnswer, solutionsOf } from "../questions.js";
import { accentMap } from "../theme.jsx";

export default function QuestionViewPage() {
  const { slug, section, topicId, subId, questionId } = useParams();
  const { refreshSubjects } = useOutletContext();
  const navigate = useNavigate();
  const hostId = subId && subId !== "answer" ? subId : topicId;
  const onMainTopic = hostId === topicId;
  const [sub, setSub] = useState(() => peekTopic(hostId) || null);
  const [parent, setParent] = useState(
    () => peekTopic(hostId)?.parentTopic || null
  );
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [status, setStatus] = useState("");

  const listPath = onMainTopic
    ? `/learning/${slug}/${section}/${topicId}/answer`
    : `/learning/${slug}/${section}/${topicId}/${subId}`;

  async function load() {
    try {
      const [topic, item] = await Promise.all([
        getTopic(hostId),
        getQuestion(questionId),
      ]);
      setSub(topic);
      setQuestion(item);
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
    if (cached) {
      setSub(cached);
      if (cached.parentTopic) setParent(cached.parentTopic);
    }
    load();
  }, [questionId, hostId]);

  async function saveQuestion(values) {
    await updateQuestion(question._id, values);
    await refreshSubjects();
    await load();
  }

  async function removeQuestion() {
    await deleteQuestion(question._id);
    await refreshSubjects();
    navigate(listPath);
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
    return (
      <Navigate
        to={`/learning/${slug}/${section}/${topicId}/answer`}
        replace
      />
    );
  }

  if (!sub || !question) {
    return <p className="p-8 text-muted">Loading question…</p>;
  }

  const accent = accentMap[sub.subject?.accent] || accentMap.gold;
  const parentTitle = parent?.title || sub.parentTopic?.title || "Topic";
  const siblingSections = onMainTopic
    ? sub.subtopics || []
    : parent?.subtopics || [];
  const ways = solutionsOf(question);

  return (
    <div className="page-pad min-h-screen">
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
          <Link to={listPath} className="hover:underline">
            {sub.title}
          </Link>
        ) : (
          <>
            <Link
              to={`/learning/${slug}/${section}/${topicId}`}
              className="hover:underline"
            >
              {parentTitle}
            </Link>
            {" · "}
            <Link to={listPath} className="hover:underline">
              {sub.title}
            </Link>
          </>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="inline-flex max-w-full items-start gap-2 text-2xl font-semibold sm:text-3xl">
            {!questionHasAnswer(question) ? (
              <span
                className="missing-answer-dot mt-2.5"
                title="No answer yet"
                aria-label="No answer yet"
              />
            ) : null}
            <span className="min-w-0 break-words">{question.title}</span>
          </h2>
          {question.prompt ? (
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted">
              {question.prompt}
            </p>
          ) : null}
          {question.relatedSection?.title ? (
            <p className="mt-2 text-xs text-muted">
              Related: {question.relatedSection.title}
            </p>
          ) : null}
          {status ? (
            <p className="mt-2 text-xs text-teal">{status}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              difficultyMeta(question.difficulty).className
            }`}
          >
            {difficultyMeta(question.difficulty).label}
          </span>
          <button
            type="button"
            onClick={toggleReview}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              sub.inReview
                ? "border-teal/50 bg-teal/20 text-teal"
                : "border-white/15 bg-white/5 text-[#c8cfe0] hover:bg-white/10 hover:text-white"
            }`}
          >
            {sub.inReview ? "✓ In review" : "Add to review"}
          </button>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-lg border border-cyan/30 px-3 py-1.5 text-xs text-cyan hover:bg-cyan/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="rounded-lg border border-coral/30 px-3 py-1.5 text-xs text-coral hover:bg-coral/10"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {ways.length ? (
          ways.map((way, index) => (
            <div
              key={way.id || index}
              className="rounded-2xl border border-line bg-[#222838]/80 p-4"
            >
              <p className="text-[11px] tracking-[0.14em] text-muted uppercase">
                Way {index + 1}
                {way.language ? ` · ${way.language}` : ""}
              </p>
              {way.logic ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {way.logic}
                </p>
              ) : null}
              {way.code ? (
                <pre
                  className="code-block mt-4 overflow-x-auto rounded-xl bg-[#0f141f] p-4 text-[13px] leading-6 text-[#e9edf4]"
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(way.code),
                  }}
                />
              ) : (
                <p className="mt-3 text-sm text-muted">No code for this way.</p>
              )}
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-sm text-muted">
            No answers yet. Use Edit to add code.
          </p>
        )}
      </div>

      {editOpen ? (
        <QuestionFormModal
          heading="Edit question"
          submitLabel="Save changes"
          initial={question}
          sections={siblingSections}
          currentSectionId={sub._id}
          onClose={() => setEditOpen(false)}
          onSubmit={saveQuestion}
        />
      ) : null}

      {confirmOpen ? (
        <ConfirmDialog
          kicker="Delete"
          title={`Delete “${question.title}”?`}
          message="This question will be removed from this section."
          onClose={() => setConfirmOpen(false)}
          onConfirm={removeQuestion}
        />
      ) : null}
    </div>
  );
}
