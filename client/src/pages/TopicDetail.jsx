import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  createQuestion,
  createTopic,
  deleteQuestion,
  deleteTopic,
  getQuestion,
  getQuestions,
  getTopic,
  peekQuestions,
  peekTopic,
  updateQuestion,
  updateTopic,
} from "../api.js";
import StudyGoalsPanel from "../components/StudyGoalsPanel.jsx";
import TopicFormModal, { StarIcon } from "../components/TopicFormModal.jsx";
import QuestionFormModal from "../components/QuestionFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { difficultyMeta } from "../difficulty.js";
import {
  clearLocalNotebook,
  emptyNotebook,
  notebookHasContent,
  notebookPlainText,
  normalizeNotebook,
  readLocalNotebook,
} from "../notebook.js";
import { accentMap } from "../theme.jsx";
import { questionHasAnswer } from "../questions.js";

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
  const [questions, setQuestions] = useState(
    () => peekQuestions(topicId) || []
  );
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const skipNotebookRestore = useRef(false);

  async function load() {
    try {
      if (section === "practical") {
        const [data, list] = await Promise.all([
          getTopic(topicId),
          getQuestions(topicId),
        ]);
        setTopic(data);
        setQuestions(Array.isArray(list) ? list : []);
        setError("");
        return;
      }
      const data = await getTopic(topicId);
      if (skipNotebookRestore.current) {
        skipNotebookRestore.current = false;
        clearLocalNotebook(topicId);
        setTopic({ ...data, notebook: emptyNotebook() });
        setError("");
        return;
      }
      setTopic((prev) => {
        const incoming = normalizeNotebook(data.notebook);
        const previous = normalizeNotebook(prev?.notebook);
        const local = readLocalNotebook(topicId);
        const keep =
          notebookHasContent(incoming)
            ? incoming
            : notebookHasContent(previous)
              ? previous
              : notebookHasContent(local)
                ? local
                : incoming;
        if (!notebookHasContent(incoming) && notebookHasContent(keep)) {
          updateTopic(topicId, { notebook: keep }).catch(() => {});
        }
        return { ...data, notebook: keep };
      });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const cached = peekTopic(topicId);
    if (cached) setTopic(cached);
    else setTopic(null);
    setQuestions(section === "practical" ? peekQuestions(topicId) || [] : []);
    load();
  }, [topicId, section]);

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

  async function removeAnswer() {
    skipNotebookRestore.current = true;
    const empty = emptyNotebook();
    clearLocalNotebook(topicId);
    setTopic((prev) => (prev ? { ...prev, notebook: empty } : prev));
    await updateTopic(topicId, { notebook: empty });
    await afterChange();
  }

  async function addQuestion(values) {
    await createQuestion(topicId, values);
    await afterChange();
  }

  async function saveQuestion(values) {
    await updateQuestion(editQuestion._id, values);
    await afterChange();
  }

  async function removeQuestion(item) {
    await deleteQuestion(item._id);
    await afterChange();
  }

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }

  if (!topic) {
    return <p className="p-8 text-muted">Loading…</p>;
  }

  const accent = accentMap[topic.subject?.accent] || accentMap.teal;
  const answerPath = `/learning/${slug}/${section}/${topicId}/answer`;
  const answerNotebook = (() => {
    const fromApi = normalizeNotebook(topic.notebook);
    if (notebookHasContent(fromApi)) return fromApi;
    const local = readLocalNotebook(topic._id);
    return local && notebookHasContent(local) ? local : fromApi;
  })();
  const answerPreview = notebookPlainText(answerNotebook);
  const hasAnswer =
    section === "practical"
      ? questions.length > 0
      : notebookHasContent(answerNotebook);
  const isPractical = section === "practical";
  const subReview = (topic.subtopics || []).filter((s) => s.inReview);
  const reviewItems = [
    ...(topic.inReview
      ? [{ _id: topic._id, title: topic.title, isMain: true }]
      : []),
    ...subReview,
  ];
  const fromAnswer = topic.fromAnswer || [];

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
          {isPractical
            ? "Questions for this topic show below. Open View answer to write the solution. Subtopics have their own lists."
            : "This topic has one answer notebook. Each subtopic has its own notebook. Highlighted phrases in a subtopic become nested notes."}
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
          {isPractical ? (
            <button
              type="button"
              onClick={() => setAddQuestionOpen(true)}
              className="rounded-xl border border-teal/40 bg-teal/12 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/18"
            >
              Add question
            </button>
          ) : (
            <Link
              to={answerPath}
              className="rounded-xl border border-teal/40 bg-teal/12 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/18"
            >
              {hasAnswer ? "Open answer" : "Add answer"}
            </Link>
          )}
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
              {reviewItems.length}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {reviewItems.length ? (
              reviewItems.map((item) => (
                <li key={item._id}>
                  <Link
                    to={
                      item.isMain
                        ? answerPath
                        : `/learning/${slug}/${section}/${topicId}/${item._id}`
                    }
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-teal/20 bg-[#171c2a]/80 px-3 py-2.5 text-sm hover:border-teal/40"
                  >
                    <span className="min-w-0 flex-1 break-words font-medium">
                      {item.title}
                      {item.isMain ? (
                        <span className="ml-2 text-xs font-normal text-muted">
                          {isPractical ? "topic questions" : "topic answer"}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[11px] text-teal">
                      {isPractical ? "Open questions →" : "Open notebook →"}
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-teal/25 px-3 py-4 text-sm text-muted">
                {isPractical
                  ? "No review items yet. Open the topic questions or a subtopic and click Add to review."
                  : "No review items yet. Open the topic answer or a subtopic notebook and click Add to review."}
              </li>
            )}
          </ul>
        </div>

        {section !== "practical" ? (
          <div className="mt-6 rounded-2xl border border-teal/30 bg-teal/8 p-4 ring-1 ring-teal/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-teal uppercase">
                  Answer
                </p>
                <h3 className="mt-1 text-lg font-semibold">On this topic</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasAnswer ? (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        title: "Delete this answer?",
                        message:
                          "The topic note will be cleared. Subtopics are not removed.",
                        onConfirm: removeAnswer,
                      })
                    }
                    className="rounded-xl border border-coral/35 px-4 py-2 text-sm text-coral hover:bg-coral/10"
                  >
                    Delete answer
                  </button>
                ) : null}
                <Link
                  to={answerPath}
                  className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e]"
                >
                  {hasAnswer ? "Open answer" : "Add answer"}
                </Link>
              </div>
            </div>
            {hasAnswer ? (
              <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-ink">
                {answerPreview || "Open to see the full notebook."}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Write the topic answer here. Subtopic notebooks below stay
                separate.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-teal/30 bg-teal/8 p-4 ring-1 ring-teal/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-teal uppercase">
                  Questions
                </p>
                <h3 className="mt-1 text-lg font-semibold">On this topic</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddQuestionOpen(true)}
                className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e]"
              >
                Add question
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {questions.length ? (
                questions.map((item, index) => (
                  <li
                    key={item._id}
                    className="topic-row rounded-xl border border-teal/20 bg-[#171c2a]/80 px-3 py-2.5"
                  >
                    <span className="topic-row-meta w-8 text-xs text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Link
                      to={`${answerPath}/${item._id}`}
                      className="topic-row-title inline-flex items-center gap-2 text-sm font-medium hover:text-teal"
                    >
                      {!questionHasAnswer(item) ? (
                        <span
                          className="missing-answer-dot"
                          title="No answer yet"
                          aria-label="No answer yet"
                        />
                      ) : null}
                      <span className="min-w-0 break-words">{item.title}</span>
                    </Link>
                    {item.collectionName ? (
                      <span
                        className="topic-row-meta rounded-full border border-cyan/25 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] text-cyan"
                        title={`Collection: ${item.collectionName}`}
                      >
                        {item.collectionName}
                      </span>
                    ) : null}
                    <span
                      className={`topic-row-meta rounded-full border px-2 py-0.5 text-[10px] ${
                        difficultyMeta(item.difficulty).className
                      }`}
                    >
                      {difficultyMeta(item.difficulty).label}
                    </span>
                    <div className="topic-row-actions">
                      <Link
                        to={`${answerPath}/${item._id}`}
                        className="rounded-lg border border-teal/35 bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal hover:bg-teal/15"
                      >
                        View answer
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setEditQuestion(await getQuestion(item._id));
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
                            message:
                              "This question will be removed from this topic.",
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
                <li className="rounded-xl border border-dashed border-teal/25 px-3 py-4 text-sm text-muted">
                  No questions on this topic yet. Add one here — you do not need
                  a subtopic first.
                </li>
              )}
            </ul>
          </div>
        )}

        {!isPractical && fromAnswer.length ? (
          <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/8 p-4">
            <p className="text-[11px] tracking-[0.18em] text-gold uppercase">
              From the topic answer
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {fromAnswer.map((note) => (
                <li
                  key={note._id}
                  className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold"
                >
                  {note.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
                {isPractical ? (
                  <span className="topic-row-meta text-xs text-muted">
                    {sub.questionCount || 0} questions
                  </span>
                ) : (
                  <>
                    {sub.hasNotebook ? (
                      <span className="topic-row-meta text-[10px] text-teal">
                        notes
                      </span>
                    ) : null}
                    <span
                      className={`topic-row-meta rounded-full border px-2 py-0.5 text-[10px] ${
                        difficultyMeta(sub.difficulty).className
                      }`}
                    >
                      {difficultyMeta(sub.difficulty).label}
                    </span>
                  </>
                )}
                <div className="topic-row-actions">
                {isPractical ? (
                  <Link
                    to={`/learning/${slug}/${section}/${topicId}/${sub._id}`}
                    className="text-xs text-teal hover:underline"
                  >
                    Open questions →
                  </Link>
                ) : (
                  <Link
                    to={`/learning/${slug}/${section}/${topicId}/${sub._id}`}
                    className="text-xs text-teal hover:underline"
                  >
                    Open notebook →
                  </Link>
                )}
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
                      message: isPractical
                        ? "This subtopic and its questions will be removed."
                        : "This subtopic notebook and its nested notes will be removed.",
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
            <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
              {isPractical
                ? "No subtopics yet. Questions for this topic are listed above."
                : "No subtopics yet. The topic answer above stays saved on its own."}
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
            <span className="text-teal">{reviewItems.length}</span>
          </div>
          {!isPractical ? (
            <div className="flex justify-between">
              <span className="text-muted">Topic answer</span>
              <span className={hasAnswer ? "text-teal" : "text-muted"}>
                {hasAnswer ? "Saved" : "Empty"}
              </span>
            </div>
          ) : null}
          {section === "practical" ? (
            <div className="flex justify-between">
              <span className="text-muted">Questions</span>
              <span className="text-teal">{questions.length}</span>
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

      {addQuestionOpen ? (
        <QuestionFormModal
          heading="New question"
          submitLabel="Add question"
          sections={topic.subtopics || []}
          currentSectionId={topic._id}
          onClose={() => setAddQuestionOpen(false)}
          onSubmit={addQuestion}
        />
      ) : null}

      {editQuestion ? (
        <QuestionFormModal
          heading="Edit question"
          submitLabel="Save changes"
          initial={editQuestion}
          sections={topic.subtopics || []}
          currentSectionId={topic._id}
          onClose={() => setEditQuestion(null)}
          onSubmit={saveQuestion}
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
