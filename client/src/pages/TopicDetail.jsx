import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  createTopic,
  deleteTopic,
  getTopic,
  peekTopic,
  updateTopic,
} from "../api.js";
import StudyGoalsPanel from "../components/StudyGoalsPanel.jsx";
import TopicFormModal, { StarIcon } from "../components/TopicFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { difficultyMeta } from "../difficulty.js";
import { notebookHasContent } from "../notebook.js";
import { accentMap } from "../theme.jsx";

const levelClass = {
  low: "text-teal bg-teal/12",
  medium: "text-gold bg-gold/12",
  hard: "text-coral bg-coral/12",
};

export default function TopicDetail() {
  const { slug, section, topicId } = useParams();
  const { refreshSubjects } = useOutletContext();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(() => peekTopic(topicId) || null);
  const [error, setError] = useState("");
  const [editMain, setEditMain] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [addSub, setAddSub] = useState(false);
  const [openNested, setOpenNested] = useState({});
  const [confirm, setConfirm] = useState(null);

  async function load() {
    try {
      const data = await getTopic(topicId);
      setTopic(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const cached = peekTopic(topicId);
    if (cached) setTopic(cached);
    else setTopic(null);
    load();
  }, [topicId]);

  async function afterChange() {
    await load();
    await refreshSubjects();
  }

  async function saveMain(values) {
    await updateTopic(topic._id, values);
    await afterChange();
  }

  async function removeMain() {
    await deleteTopic(topic._id);
    await refreshSubjects();
    navigate(`/learning/${slug}/${section}`);
  }

  async function saveSub(values) {
    if (editSub) {
      await updateTopic(editSub._id, { title: values.title, slNo: values.slNo });
    }
    await afterChange();
  }

  async function createSub(values) {
    await createTopic({
      subjectSlug: slug,
      parentId: topic._id,
      title: values.title,
      slNo: values.slNo,
      section,
    });
    await afterChange();
  }

  async function removeSub(sub) {
    await deleteTopic(sub._id);
    await afterChange();
  }

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }

  if (!topic) {
    return <p className="p-8 text-muted">Loading…</p>;
  }

  const accent = accentMap[topic.subject?.accent] || accentMap.teal;
  const hasSubs = Boolean(topic.subtopics?.length);
  const answerPath = `/learning/${slug}/${section}/${topicId}/answer`;
  const hasAnswer =
    section === "practical"
      ? Number(topic.questionCount) > 0
      : notebookHasContent(topic.notebook);
  const showAnswerCta = !hasSubs || hasAnswer;

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad">
        <p className={`text-[12px] tracking-[0.18em] uppercase ${accent.text}`}>
          <Link to={`/learning/${slug}`} className="hover:underline">
            {topic.subject?.shortName || slug}
          </Link>
          {" · "}
          <Link to={`/learning/${slug}/${section}`} className="hover:underline">
            {section === "practical" ? "Practical" : "Theory"}
          </Link>
        </p>

        <div className="mt-3 flex flex-wrap items-start gap-3">
          {topic.highlighted ? (
            <span className="mt-2 shrink-0 text-gold">
              <StarIcon filled className="h-5 w-5" />
            </span>
          ) : null}
          <h2 className="min-w-0 flex-1 text-2xl font-semibold break-words sm:text-3xl">{topic.title}</h2>
          <span
            className={`mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] capitalize ${
              levelClass[topic.level] || levelClass.medium
            }`}
          >
            {topic.level}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          {section === "practical"
            ? hasSubs
              ? "Click a subtopic to open its questions. Add a subtopic first if this topic is empty."
              : "No subtopics yet — add a question on this topic, or add a subtopic to split it up."
            : hasSubs
              ? "Click a subsection to open its notebook. Select text in the notebook and click Add to subtopic — those phrases show under View more. Click Add to subtopic again to remove them."
              : "No subtopics yet — write the answer on this topic, or add a subtopic if you want to split it."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditMain(true)}
            className="rounded-xl border border-line bg-white/5 px-4 py-2 text-sm"
          >
            Edit topic
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirm({
                title: `Delete “${topic.title}”?`,
                message:
                  "This removes the topic and everything under it. You cannot undo this.",
                onConfirm: removeMain,
              })
            }
            className="rounded-xl border border-coral/30 px-4 py-2 text-sm text-coral"
          >
            Delete topic
          </button>
          <button
            type="button"
            onClick={() => setAddSub(true)}
            className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e]"
          >
            Add subtopic
          </button>
          {showAnswerCta ? (
            <Link
              to={answerPath}
              className="rounded-xl border border-teal/40 bg-teal/12 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/18"
            >
              {hasAnswer
                ? section === "practical"
                  ? "Open questions"
                  : "Open answer"
                : section === "practical"
                  ? "Add question"
                  : "Add answer"}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-teal/35 bg-teal/8 p-4 ring-1 ring-teal/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-teal uppercase">
                Special section
              </p>
              <h3 className="mt-1 text-lg font-semibold">Review topics</h3>
            </div>
            <span className="rounded-full bg-teal/15 px-2.5 py-1 text-xs text-teal">
              {topic.subtopics?.filter((s) => s.inReview).length || 0}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {topic.subtopics?.filter((s) => s.inReview).length ? (
              topic.subtopics
                .filter((s) => s.inReview)
                .map((sub) => (
                  <li key={sub._id}>
                    <Link
                      to={`/learning/${slug}/${section}/${topicId}/${sub._id}`}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-teal/20 bg-[#171c2a]/80 px-3 py-2.5 text-sm hover:border-teal/40"
                    >
                      <span className="min-w-0 flex-1 break-words font-medium">{sub.title}</span>
                      <span className="shrink-0 text-[11px] text-teal">
                        {section === "practical" ? "Open questions →" : "Open notebook →"}
                      </span>
                    </Link>
                  </li>
                ))
            ) : (
              <li className="rounded-xl border border-dashed border-teal/25 px-3 py-4 text-sm text-muted">
                {section === "practical"
                  ? "No review items yet. Open a subtopic and click Add to review."
                  : "No review items yet. Open a subsection notebook and click Add to review."}
              </li>
            )}
          </ul>
        </div>

        <ul className="mt-6 space-y-3">
          {topic.subtopics?.length ? (
            topic.subtopics.map((sub, index) => (
              <li
                key={sub._id}
                className="rounded-2xl border border-line bg-[#222838]/80 px-4 py-3"
              >
                <div className="topic-row">
                <span className="topic-row-meta w-8 text-sm text-muted">
                  {String(sub.slNo ?? index + 1).padStart(2, "0")}
                </span>
                <Link
                  to={`/learning/${slug}/${section}/${topicId}/${sub._id}`}
                  className="topic-row-title font-medium hover:text-teal"
                >
                  {sub.title}
                </Link>
                {section === "practical" ? (
                  <span className="topic-row-meta text-xs text-muted">
                    {sub.questionCount || 0} questions
                  </span>
                ) : (
                  <span
                    className={`topic-row-meta rounded-full border px-2 py-0.5 text-[10px] ${
                      difficultyMeta(sub.difficulty).className
                    }`}
                  >
                    {difficultyMeta(sub.difficulty).label}
                  </span>
                )}
                <div className="topic-row-actions">
                {section === "practical" ? (
                  <Link
                    to={`/learning/${slug}/${section}/${topicId}/${sub._id}`}
                    className="text-xs text-teal hover:underline"
                  >
                    Open questions →
                  </Link>
                ) : null}
                {sub.inReview ? (
                  <span className="rounded-full border border-teal/30 bg-teal/12 px-2 py-0.5 text-[10px] text-teal">
                    Review
                  </span>
                ) : null}
                {section !== "practical" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenNested((prev) => ({
                        ...prev,
                        [sub._id]: !prev[sub._id],
                      }))
                    }
                    className="rounded-lg border border-line px-2 py-1 text-[11px] text-cyan"
                  >
                    {openNested[sub._id] ? "Hide" : "View more"}
                    {sub.nested?.length ? ` (${sub.nested.length})` : ""}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditSub(sub)}
                  className="rounded-lg border border-cyan/30 px-2.5 py-1 text-xs text-cyan hover:bg-cyan/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirm({
                      title: `Delete “${sub.title}”?`,
                      message: "This subtopic and its notes will be removed.",
                      onConfirm: () => removeSub(sub),
                    })
                  }
                  className="text-xs text-coral/80 hover:text-coral"
                >
                  delete
                </button>
                </div>
                </div>
                {openNested[sub._id] && section !== "practical" ? (
                  <ul className="mt-3 ml-8 space-y-1.5 border-l border-line pl-3">
                    {sub.nested?.length ? (
                      sub.nested.map((note) => (
                        <li key={note._id}>
                          <span className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-[#171c2a] px-3 py-1.5 text-sm text-gold">
                            <span className="min-w-0 break-words">{note.title}</span>
                            <span className="text-[10px] text-muted">
                              from note
                            </span>
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="rounded-lg px-3 py-1.5 text-sm text-muted">
                        No phrases from this notebook yet. Open it, select text,
                        and click Add to subtopic.
                      </li>
                    )}
                  </ul>
                ) : null}
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-line px-4 py-6">
              <p className="text-sm text-muted">
                No subtopics yet.
              </p>
              <p className="mt-1 text-sm text-muted">
                {section === "practical"
                  ? "Add a question here, or add a subtopic if you want a separate list."
                  : "Write the answer on this topic, or add a subtopic if you want to split it."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={answerPath}
                  className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e]"
                >
                  {section === "practical" ? "Add question" : "Add answer"}
                </Link>
                <button
                  type="button"
                  onClick={() => setAddSub(true)}
                  className="rounded-xl border border-line bg-white/5 px-4 py-2 text-sm"
                >
                  Add subtopic
                </button>
              </div>
            </li>
          )}
        </ul>
      </section>

      <aside className="page-aside xl:sticky xl:top-0 xl:max-h-screen xl:overflow-y-auto">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          Topic
        </p>
        <h3 className="mt-2 text-lg font-semibold">{topic.title}</h3>
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtopics</span>
            <span className="text-teal">{topic.subtopics?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Review topics</span>
            <span className="text-teal">
              {topic.subtopics?.filter((s) => s.inReview).length || 0}
            </span>
          </div>
          {section === "practical" ? (
            <div className="flex justify-between">
              <span className="text-muted">Questions</span>
              <span className="text-teal">
                {(topic.questionCount || 0) +
                  (topic.subtopics?.reduce(
                    (sum, s) => sum + (s.questionCount || 0),
                    0
                  ) || 0)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted">Highlight</span>
            <span className={topic.highlighted ? "text-gold" : "text-muted"}>
              {topic.highlighted ? "Starred" : "Off"}
            </span>
          </div>
        </div>
        <StudyGoalsPanel slug={slug} section={section} />
      </aside>

      {editMain ? (
        <TopicFormModal
          heading="Update main topic"
          submitLabel="Update topic"
          showHighlight
          initial={topic}
          onClose={() => setEditMain(false)}
          onSubmit={saveMain}
        />
      ) : null}

      {addSub ? (
        <TopicFormModal
          heading="New subtopic"
          submitLabel="Add subtopic"
          showLevel={false}
          nextSlNo={
            Math.max(
              0,
              ...(topic.subtopics || []).map((item) => Number(item.slNo) || 0)
            ) + 1
          }
          onClose={() => setAddSub(false)}
          onSubmit={createSub}
        />
      ) : null}

      {editSub ? (
        <TopicFormModal
          heading="Update subtopic"
          submitLabel="Update"
          showLevel={false}
          initial={editSub}
          onClose={() => setEditSub(null)}
          onSubmit={saveSub}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          kicker="Delete"
          title={confirm.title}
          message={confirm.message}
          confirmLabel="Delete"
          onClose={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
        />
      ) : null}
    </div>
  );
}
