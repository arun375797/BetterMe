import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router-dom";
import { createTopic, deleteTopic, getReviewQueue, getReviseQueue, getSubject, getSubjectQuestions, peekReviewQueue, peekReviseQueue, peekSubject, updateQuestion, updateTopic } from "../api.js";
import StudyGoalsPanel from "../components/StudyGoalsPanel.jsx";
import PdfExportDialog from "../components/PdfExportDialog.jsx";
import TopicFormModal, { StarIcon } from "../components/TopicFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import FavoriteButton from "../components/FavoriteButton.jsx";
import { notebookPath, reviewItemHint } from "../lib/today.js";
import { accentMap } from "../theme.jsx";
import { DIFFICULTIES } from "../difficulty.js";

const levelClass = {
  low: "text-teal bg-teal/12",
  medium: "text-gold bg-gold/12",
  hard: "text-coral bg-coral/12",
};

function searchableText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function topicSearchValues(topic) {
  const values = [topic.title];
  for (const question of topic.searchQuestions || []) values.push(question.title);
  for (const subtopic of topic.subtopics || []) {
    values.push(subtopic.title);
    for (const question of subtopic.searchQuestions || []) {
      values.push(question.title);
    }
    for (const nested of subtopic.nested || []) {
      values.push(nested.title);
      for (const question of nested.searchQuestions || []) {
        values.push(question.title);
      }
    }
  }
  return values.map(searchableText);
}

function matchesSearch(topic, terms) {
  return topicSearchValues(topic).some((value) =>
    terms.every((term) => value.includes(term))
  );
}

export default function SubjectPage() {
  const { slug, section } = useParams();
  const { refreshSubjects } = useOutletContext();
  const [subject, setSubject] = useState(
    () => peekSubject(slug, section) || null
  );
  const [reviewQueue, setReviewQueue] = useState(
    () => peekReviewQueue() || []
  );
  const [reviseQueue, setReviseQueue] = useState(
    () => peekReviseQueue() || []
  );
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showTree, setShowTree] = useState(false);
  const [openIds, setOpenIds] = useState({});
  const [pdfOpen, setPdfOpen] = useState(false);
  const [allQuestionsOpen, setAllQuestionsOpen] = useState(false);
  const [allQuestions, setAllQuestions] = useState(null);
  const [allQuestionsLoading, setAllQuestionsLoading] = useState(false);
  const [allQuestionsError, setAllQuestionsError] = useState("");
  const [clearedSaving, setClearedSaving] = useState({});
  const [clearedErrors, setClearedErrors] = useState({});
  const [favoriteErrors, setFavoriteErrors] = useState({});
  const [allQuestionSearch, setAllQuestionSearch] = useState("");
  const [allQuestionTopic, setAllQuestionTopic] = useState("all");
  const [allQuestionDifficulty, setAllQuestionDifficulty] = useState("all");
  const [allQuestionAnswer, setAllQuestionAnswer] = useState("all");
  const [allQuestionStarred, setAllQuestionStarred] = useState("all");
  const allQuestionsRequest = useRef(0);

  const isPractical = section === "practical";
  const childLabel = "subtopics";

  async function load() {
    try {
      const data = await getSubject(slug, section);
      setSubject(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const cached = peekSubject(slug, section);
    if (cached) setSubject(cached);
    else setSubject(null);
    setQuery("");
    setModalOpen(false);
    setEditTopic(null);
    setConfirm(null);
    setShowTree(false);
    setOpenIds({});
    setPdfOpen(false);
    setAllQuestionsOpen(false);
    setAllQuestions(null);
    setAllQuestionsLoading(false);
    setAllQuestionsError("");
    setClearedSaving({});
    setClearedErrors({});
    setFavoriteErrors({});
    allQuestionsRequest.current += 1;
    setAllQuestionSearch("");
    setAllQuestionTopic("all");
    setAllQuestionDifficulty("all");
    setAllQuestionAnswer("all");
    setAllQuestionStarred("all");
    let live = true;
    getSubject(slug, section)
      .then((data) => {
        if (!live) return;
        setSubject(data);
        setError("");
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    getReviewQueue()
      .then((data) => {
        if (!live) return;
        setReviewQueue(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (live) setReviewQueue([]);
      });
    getReviseQueue()
      .then((data) => {
        if (!live) return;
        setReviseQueue(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (live) setReviseQueue([]);
      });
    return () => {
      live = false;
    };
  }, [slug, section]);

  async function addMainTopic({ title, level, slNo, highlighted }) {
    await createTopic({
      subjectSlug: slug,
      title,
      level,
      slNo,
      section,
      highlighted: Boolean(highlighted),
    });
    await load();
    await refreshSubjects();
  }

  const filtered = useMemo(() => {
    if (!subject) return [];
    const terms = searchableText(query).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return subject.topics;
    return subject.topics.filter((topic) => matchesSearch(topic, terms));
  }, [subject, query]);

  const reviewItems = useMemo(() => {
    return (reviewQueue || []).filter(
      (item) =>
        item.subject?.slug === slug &&
        (item.section || "theory") === section
    );
  }, [reviewQueue, slug, section]);

  const reviseItems = useMemo(() => {
    return (reviseQueue || []).filter(
      (item) =>
        item.subject?.slug === slug &&
        (item.section || "theory") === section
    );
  }, [reviseQueue, slug, section]);

  async function toggleAllQuestions() {
    if (allQuestionsOpen) {
      setAllQuestionsOpen(false);
      return;
    }

    setAllQuestionsOpen(true);
    if (allQuestions !== null || allQuestionsLoading) return;

    setAllQuestionsLoading(true);
    setAllQuestionsError("");
    const requestId = ++allQuestionsRequest.current;
    try {
      const items = await getSubjectQuestions(slug, section);
      if (requestId === allQuestionsRequest.current) {
        setAllQuestions(items);
      }
    } catch (err) {
      if (requestId === allQuestionsRequest.current) {
        setAllQuestionsError(err.message || "Could not load section questions.");
      }
    } finally {
      if (requestId === allQuestionsRequest.current) {
        setAllQuestionsLoading(false);
      }
    }
  }

  async function toggleQuestionCleared(question) {
    const next = !question.cleared;
    setAllQuestions((current) =>
      (current || []).map((item) =>
        item._id === question._id ? { ...item, cleared: next } : item
      )
    );
    setClearedSaving((current) => ({ ...current, [question._id]: true }));
    setFavoriteErrors((current) => ({ ...current, [question._id]: "" }));
    try {
      const saved = await updateQuestion(question._id, { cleared: next });
      setAllQuestions((current) =>
        (current || []).map((item) =>
          item._id === question._id
            ? { ...item, cleared: Boolean(saved.cleared) }
            : item
        )
      );
    } catch (err) {
      setAllQuestions((current) =>
        (current || []).map((item) =>
          item._id === question._id
            ? { ...item, cleared: Boolean(question.cleared) }
            : item
        )
      );
      setClearedErrors((current) => ({
        ...current,
        [question._id]: err.message || "Could not save cleared status.",
      }));
    } finally {
      setClearedSaving((current) => ({
        ...current,
        [question._id]: false,
      }));
    }
  }

  async function toggleQuestionFavorite(question) {
    const next = !question.favorite;
    setAllQuestions((current) =>
      (current || []).map((item) =>
        item._id === question._id ? { ...item, favorite: next } : item
      )
    );
    setClearedErrors((current) => ({ ...current, [question._id]: "" }));
    try {
      const saved = await updateQuestion(question._id, { favorite: next });
      setAllQuestions((current) =>
        (current || []).map((item) =>
          item._id === question._id
            ? { ...item, favorite: Boolean(saved.favorite) }
            : item
        )
      );
    } catch (err) {
      setAllQuestions((current) =>
        (current || []).map((item) =>
          item._id === question._id
            ? { ...item, favorite: Boolean(question.favorite) }
            : item
        )
      );
      setFavoriteErrors((current) => ({
        ...current,
        [question._id]: err.message || "Could not update favourite.",
      }));
    }
  }

  const visibleAllQuestions = useMemo(() => {
    const terms = searchableText(allQuestionSearch).trim().split(/\s+/).filter(Boolean);
    return (allQuestions || []).filter((item) => {
      if (
        allQuestionTopic !== "all" &&
        String(item.sectionTopicId) !== allQuestionTopic
      ) {
        return false;
      }
      if (
        allQuestionDifficulty !== "all" &&
        (item.difficulty || "medium") !== allQuestionDifficulty
      ) {
        return false;
      }
      if (
        allQuestionAnswer === "answered" &&
        !item.hasAnswer
      ) {
        return false;
      }
      if (
        allQuestionAnswer === "unanswered" &&
        item.hasAnswer
      ) {
        return false;
      }
      if (allQuestionStarred === "starred" && !item.favorite) {
        return false;
      }
      const searchable = searchableText(
        `${item.title} ${item.sectionTopicTitle} ${item.topicTitle}`
      );
      return terms.every((term) => searchable.includes(term));
    });
  }, [
    allQuestions,
    allQuestionSearch,
    allQuestionTopic,
    allQuestionDifficulty,
    allQuestionAnswer,
    allQuestionStarred,
  ]);

  const questionGroups = useMemo(() => {
    const groups = new Map();
    for (const question of visibleAllQuestions) {
      const key = String(question.sectionTopicId);
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          title: question.sectionTopicTitle,
          questions: [],
        });
      }
      groups.get(key).questions.push(question);
    }
    return [...groups.values()];
  }, [visibleAllQuestions]);

  async function saveMainTopic(values) {
    await updateTopic(editTopic._id, {
      title: values.title,
      level: values.level,
      slNo: values.slNo,
      highlighted: values.highlighted,
    });
    await load();
    await refreshSubjects();
  }

  async function removeMainTopic(topic) {
    await deleteTopic(topic._id);
    await load();
    await refreshSubjects();
  }

  const nextSlNo =
    Math.max(0, ...(subject?.topics || []).map((item) => Number(item.slNo) || 0)) +
    1;

  if (section !== "theory" && section !== "practical") {
    return <Navigate to={`/learning/${slug}`} replace />;
  }

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }

  if (!subject) {
    return <p className="p-8 text-muted">Loading…</p>;
  }

  const accent = accentMap[subject.accent] || accentMap.teal;
  const sectionStats = subject.stats?.[section] || {};

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad">
        <p className={`text-[12px] tracking-[0.18em] uppercase ${accent.text}`}>
          <Link to={`/learning/${slug}`} className="hover:underline">
            {subject.shortName}
          </Link>
          {" · "}
          {isPractical ? "Practical" : "Theory"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">
          {isPractical ? "Practical topics" : "Theory topics"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {isPractical
            ? "Click a topic for questions on the topic itself and in each subtopic. Starred topics stay at the top."
            : "Click a topic for its answer notebook and subtopic notebooks. Starred topics stay at the top."}
        </p>

        <div className="mt-5 rounded-2xl border border-line bg-raised/70 p-4 ring-1 ring-teal/15">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics or questions…"
              aria-label="Search topics or questions"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50 md:max-w-[240px]"
            />
            <button
              type="button"
              onClick={() => setPdfOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal/40 bg-teal/10 text-teal transition hover:bg-teal/20 focus:outline-none focus:ring-2 focus:ring-teal/40 md:ml-auto"
              aria-label={`Download filtered ${isPractical ? "practical" : "theory"} questions as PDF`}
              title="Download questions as PDF"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#10201e]"
            >
              Add topic
            </button>
            {isPractical ? (
              <button
                type="button"
                aria-expanded={allQuestionsOpen}
                onClick={toggleAllQuestions}
                className="rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-2.5 text-sm font-medium text-cyan hover:bg-cyan/15"
              >
                {allQuestionsOpen ? "Hide questions" : "See all questions"}
              </button>
            ) : null}
            <Link
              to={`/learning/${slug}/${section}/revise`}
              className="inline-flex items-center justify-center rounded-xl border border-violet/35 bg-violet/10 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/15"
            >
              Revise{reviseItems.length ? ` (${reviseItems.length})` : ""}
            </Link>
            <button
              type="button"
              onClick={() => {
                const next = !showTree;
                setShowTree(next);
                if (!next) setOpenIds({});
              }}
              className="rounded-xl border border-line bg-white/5 px-4 py-2.5 text-sm font-medium text-cyan"
            >
              {showTree ? "Hide" : "View more"}
            </button>
          </div>
        </div>

        {isPractical && allQuestionsOpen ? (
          <section
            aria-label="All practical questions"
            className="mt-6 rounded-2xl border border-cyan/30 bg-raised/70 p-4 ring-1 ring-cyan/10"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-cyan uppercase">
                  Section questions
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  All {subject.shortName || subject.name} practical questions
                </h3>
              </div>
              {allQuestions !== null ? (
                <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-xs text-cyan">
                  {visibleAllQuestions.length} of {allQuestions.length}
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <input
                value={allQuestionSearch}
                onChange={(event) => setAllQuestionSearch(event.target.value)}
                placeholder="Search questions or topics…"
                aria-label="Search all practical questions"
                className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted/70 focus:border-cyan/50"
              />
              <select
                value={allQuestionTopic}
                onChange={(event) => setAllQuestionTopic(event.target.value)}
                aria-label="Filter by topic"
                className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan/50"
              >
                <option value="all">All topics</option>
                {(subject.topics || []).map((topic) => (
                  <option key={topic._id} value={String(topic._id)}>
                    {topic.title}
                  </option>
                ))}
              </select>
              <select
                value={allQuestionDifficulty}
                onChange={(event) => setAllQuestionDifficulty(event.target.value)}
                aria-label="Filter by difficulty"
                className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan/50"
              >
                <option value="all">All difficulties</option>
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
              <select
                value={allQuestionAnswer}
                onChange={(event) => setAllQuestionAnswer(event.target.value)}
                aria-label="Filter by answer status"
                className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan/50"
              >
                <option value="all">All answer statuses</option>
                <option value="answered">Answered</option>
                <option value="unanswered">Needs an answer</option>
              </select>
              <select
                value={allQuestionStarred}
                onChange={(event) => setAllQuestionStarred(event.target.value)}
                aria-label="Filter by starred status"
                className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan/50"
              >
                <option value="all">All questions</option>
                <option value="starred">Starred only</option>
              </select>
            </div>

            {allQuestionsLoading ? (
              <p className="mt-4 text-sm text-muted">Loading questions…</p>
            ) : allQuestionsError ? (
              <p role="alert" className="mt-4 text-sm text-coral">
                {allQuestionsError}
              </p>
            ) : allQuestions !== null && !allQuestions.length ? (
              <p className="mt-4 rounded-xl border border-dashed border-line px-3 py-5 text-center text-sm text-muted">
                No questions in this section yet.
              </p>
            ) : allQuestions !== null && !questionGroups.length ? (
              <p className="mt-4 rounded-xl border border-dashed border-line px-3 py-5 text-center text-sm text-muted">
                No questions match these filters.
              </p>
            ) : allQuestions !== null ? (
              <ul className="mt-4 space-y-4">
                {questionGroups.map((group) => (
                  <li key={group.id}>
                    <h4 className="mb-2 text-sm font-semibold text-cyan">
                      {group.title}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {group.questions.length}{" "}
                        {group.questions.length === 1 ? "question" : "questions"}
                      </span>
                    </h4>
                    <ul className="space-y-2">
                      {group.questions.map((question) => {
                        const questionPath = question.subtopic
                          ? `/learning/${slug}/${section}/${question.sectionTopicId}/${question.topicId}/${question._id}`
                          : `/learning/${slug}/${section}/${question.topicId}/answer/${question._id}`;
                        const difficulty = DIFFICULTIES.find(
                          (item) => item.id === question.difficulty
                        );
                        return (
                          <li
                            key={question._id}
                            className="rounded-xl border border-line/80 bg-surface px-3 py-2.5 hover:border-cyan/30"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={questionPath}
                                className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                              >
                                <span
                                  className={`min-w-0 flex-1 break-words text-sm font-medium ${
                                    question.cleared
                                      ? "text-muted line-through"
                                      : ""
                                  }`}
                                >
                                  {question.title}
                                  {question.subtopic ? (
                                    <span className="ml-2 text-xs font-normal text-muted no-underline">
                                      {question.topicTitle}
                                    </span>
                                  ) : null}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                                    difficulty?.className ||
                                    "text-gold bg-gold/12"
                                  }`}
                                >
                                  {difficulty?.label || "Medium"}
                                </span>
                                <span
                                  className={`text-[10px] ${
                                    question.hasAnswer
                                      ? "text-teal"
                                      : "text-coral"
                                  }`}
                                >
                                  {question.hasAnswer
                                    ? "Answered"
                                    : "Needs answer"}
                                </span>
                                <span className="shrink-0 text-xs text-cyan">
                                  Open →
                                </span>
                              </Link>
                              <FavoriteButton
                                on={Boolean(question.favorite)}
                                compact
                                onClick={() =>
                                  toggleQuestionFavorite(question)
                                }
                              />
                              <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                                <input
                                  type="checkbox"
                                  checked={Boolean(question.cleared)}
                                  disabled={Boolean(clearedSaving[question._id])}
                                  onChange={() =>
                                    toggleQuestionCleared(question)
                                  }
                                  className="h-4 w-4 accent-teal"
                                  aria-label={`Mark ${question.title} as cleared`}
                                />
                                Cleared
                              </label>
                            </div>
                            {clearedErrors[question._id] ? (
                              <p role="alert" className="mt-1 text-xs text-coral">
                                {clearedErrors[question._id]}
                              </p>
                            ) : null}
                            {favoriteErrors[question._id] ? (
                              <p role="alert" className="mt-1 text-xs text-coral">
                                {favoriteErrors[question._id]}
                              </p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <div className="mt-6 rounded-2xl border border-teal/35 bg-teal/8 p-4 ring-1 ring-teal/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-teal uppercase">
                Special section
              </p>
              <h3 className="mt-1 text-lg font-semibold">Review</h3>
            </div>
            <span className="rounded-full bg-teal/15 px-2.5 py-1 text-xs text-teal">
              {reviewItems.length}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {reviewItems.length ? (
              reviewItems.map((item) => (
                <li key={`${item.kind || "topic"}-${item._id}`}>
                  <Link
                    to={notebookPath(item)}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-teal/20 bg-surface/80 px-3 py-2.5 text-sm hover:border-teal/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="break-words font-medium">{item.title}</span>
                      <span className="ml-2 text-xs text-muted">
                        {reviewItemHint(item)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-teal">Open →</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-teal/25 px-3 py-4 text-sm text-muted">
                {isPractical
                  ? "Open a question and click Add to review. Only that question is queued."
                  : "Mark Add to review on a question notebook, the topic answer, or a subtopic."}
              </li>
            )}
          </ul>
        </div>

        <ul className="mt-6 space-y-3">
          {filtered.map((topic) => {
            const opened = showTree
              ? openIds[topic._id] !== false
              : Boolean(openIds[topic._id]);
            return (
              <li
                key={topic._id}
                className={`rounded-2xl border bg-raised/80 px-4 py-4 ${
                  topic.highlighted
                    ? "border-gold/40 shadow-[0_0_20px_rgba(232,195,106,0.12)]"
                    : "border-line"
                }`}
              >
                <div className="topic-row">
                  {topic.highlighted ? (
                    <span className="topic-row-meta text-gold">
                      <StarIcon filled />
                    </span>
                  ) : (
                    <span className="topic-row-meta w-4" />
                  )}
                  <span className="topic-row-meta w-8 text-sm text-muted">
                    {String(topic.slNo ?? "").padStart(2, "0")}
                  </span>
                  <Link
                    to={`/learning/${slug}/${section}/${topic._id}`}
                    className="topic-row-title text-lg font-medium hover:text-teal"
                  >
                    {topic.title}
                  </Link>
                  <span
                    className={`topic-row-meta rounded-full px-2.5 py-0.5 text-[11px] capitalize ${
                      levelClass[topic.level] || levelClass.medium
                    }`}
                  >
                    {topic.level || "medium"}
                  </span>
                  <div className="topic-row-actions">
                  <span className="text-xs text-muted">
                    {topic.subtopics?.length || 0} {childLabel}
                    {isPractical
                      ? ` · ${topic.totalQuestions ?? topic.questionCount ?? 0} questions`
                      : topic.hasNotebook
                        ? " · answer"
                        : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenIds((prev) => ({
                        ...prev,
                        [topic._id]: showTree
                          ? prev[topic._id] === false
                          : !prev[topic._id],
                      }))
                    }
                    className="rounded-lg border border-line bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan hover:bg-white/8"
                  >
                    {opened ? "Hide" : "View more"}
                  </button>
                  <Link
                    to={`/learning/${slug}/${section}/${topic._id}`}
                    className="text-xs text-cyan hover:underline"
                  >
                    Open topic →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditTopic(topic)}
                    className="rounded-lg border border-cyan/30 px-2.5 py-1 text-xs text-cyan hover:bg-cyan/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        title: `Delete “${topic.title}”?`,
                        message:
                          "This removes the topic and everything under it. You cannot undo this.",
                        onConfirm: () => removeMainTopic(topic),
                      })
                    }
                    className="inline-flex items-center justify-center rounded-lg border border-coral/30 p-1.5 text-coral/80 hover:bg-coral/10 hover:text-coral"
                    aria-label={`Delete ${topic.title}`}
                    title="Delete topic"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7m-8 0 .7 12.2A1.5 1.5 0 0 0 8.7 20.5h6.6a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
                    </svg>
                  </button>
                  </div>
                </div>

                {opened ? (
                  <div className="mt-4 border-t border-line pt-3">
                    {topic.subtopics?.length ? (
                      <ul className="space-y-1.5">
                        {topic.subtopics.map((sub, index) => (
                          <li key={sub._id}>
                            <Link
                              to={`/learning/${slug}/${section}/${topic._id}/${sub._id}`}
                              className="flex flex-wrap items-start gap-2 rounded-xl bg-surface px-3 py-2 text-sm hover:bg-white/5 sm:items-center"
                            >
                              <span className="w-6 shrink-0 text-xs text-muted">
                                {String(sub.slNo ?? index + 1).padStart(2, "0")}
                              </span>
                              <span className="min-w-0 flex-1 break-words">{sub.title}</span>
                              {!isPractical && sub.hasNotebook ? (
                                <span className="shrink-0 text-[10px] text-teal">
                                  notes
                                </span>
                              ) : null}
                              {!isPractical && sub.nested?.length ? (
                                <span className="shrink-0 text-[10px] text-gold">
                                  {sub.nested.length} in note
                                </span>
                              ) : null}
                              {sub.inReview ? (
                                <span className="shrink-0 text-[10px] text-teal">review</span>
                              ) : null}
                              {isPractical && sub.questionCount ? (
                                <span className="shrink-0 text-[10px] text-muted">
                                  {sub.questionCount} questions
                                </span>
                              ) : null}
                            </Link>
                            {!isPractical && sub.nested?.length ? (
                              <ul className="mt-1 ml-9 space-y-1">
                                {sub.nested.map((note) => (
                                  <li key={note._id}>
                                    <Link
                                      to={`/learning/${slug}/${section}/${topic._id}/${sub._id}`}
                                      className="block rounded-lg px-3 py-1 text-xs text-gold/90 hover:bg-white/5"
                                    >
                                      · {note.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-1 text-sm text-muted">
                        {isPractical
                          ? "No subtopics yet. This topic can still have its own questions."
                          : "No subtopics yet. This topic can still have an answer notebook."}
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {query.trim() && !filtered.length ? (
          <p className="mt-6 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            No topic or question contains “{query.trim()}”.
          </p>
        ) : null}
      </section>

      <aside className="page-aside xl:sticky xl:top-0 xl:max-h-screen xl:overflow-y-auto">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          This section
        </p>
        <h3 className="mt-2 text-lg font-semibold">
          {isPractical ? "Practical" : "Theory"}
        </h3>
        <div className="mt-6 space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Topics</span>
            <span>{sectionStats.mainTopics || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Subtopics</span>
            <span className="text-teal">
              {isPractical
                ? sectionStats.sections || 0
                : sectionStats.items || 0}
            </span>
          </div>
          {isPractical ? (
            <div className="flex justify-between">
              <span className="text-muted">Questions</span>
              <span>{sectionStats.items || 0}</span>
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted">
              Topic answers and subtopic notebooks are separate. Saving one
              does not clear the other.
            </p>
          )}
        </div>
        <Link
          to={`/learning/${slug}/${isPractical ? "theory" : "practical"}`}
          className="mt-8 inline-block text-xs text-cyan hover:underline"
        >
          Switch to {isPractical ? "Theory" : "Practical"}
        </Link>
        <StudyGoalsPanel slug={slug} section={section} />
      </aside>

      {modalOpen ? (
        <TopicFormModal
          heading={isPractical ? "New practical topic" : "New theory topic"}
          showHighlight
          nextSlNo={nextSlNo}
          onClose={() => setModalOpen(false)}
          onSubmit={addMainTopic}
        />
      ) : null}

      {editTopic ? (
        <TopicFormModal
          heading={isPractical ? "Edit practical topic" : "Edit theory topic"}
          submitLabel="Save changes"
          showHighlight
          initial={editTopic}
          nextSlNo={editTopic.slNo || nextSlNo}
          onClose={() => setEditTopic(null)}
          onSubmit={saveMainTopic}
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

      {pdfOpen ? (
        <PdfExportDialog
          subject={subject}
          section={section}
          visibleTopics={filtered}
          allTopics={subject.topics || []}
          query={query}
          onClose={() => setPdfOpen(false)}
        />
      ) : null}
    </div>
  );
}
