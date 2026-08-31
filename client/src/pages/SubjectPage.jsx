import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router-dom";
import { createTopic, getSubject, updateTopic } from "../api.js";
import TopicFormModal, { StarIcon } from "../components/TopicFormModal.jsx";
import { accentMap } from "../theme.jsx";

const levelClass = {
  low: "text-teal bg-teal/12",
  medium: "text-gold bg-gold/12",
  hard: "text-coral bg-coral/12",
};

export default function SubjectPage() {
  const { slug, section } = useParams();
  const { refreshSubjects } = useOutletContext();
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [showTree, setShowTree] = useState(false);
  const [openIds, setOpenIds] = useState({});

  const isPractical = section === "practical";
  const isTheory = section === "theory";
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
    setSubject(null);
    setQuery("");
    setModalOpen(false);
    setEditTopic(null);
    setShowTree(false);
    setOpenIds({});
    load();
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
    const q = query.trim().toLowerCase();
    if (!q) return subject.topics;
    return subject.topics.filter((topic) => {
      const inMain = topic.title.toLowerCase().includes(q);
      const inSub = topic.subtopics?.some((s) =>
        s.title.toLowerCase().includes(q)
      );
      return inMain || inSub;
    });
  }, [subject, query]);

  const reviewItems = useMemo(() => {
    if (!isTheory || !subject?.topics) return [];
    return subject.topics.flatMap((topic) =>
      (topic.subtopics || [])
        .filter((sub) => sub.inReview)
        .map((sub) => ({ ...sub, parentTitle: topic.title, parentId: topic._id }))
    );
  }, [isTheory, subject]);

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
            ? "Same as theory: star topics, filter, add, and View more. Click a topic for subtopics and questions."
            : "Starred topics stay at the top. Click a topic to open its subsections. Same notebook tools on every subject."}
        </p>

        <div className="mt-5 rounded-2xl border border-line bg-[#222838]/70 p-4 ring-1 ring-teal/15">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter topics…"
              className="w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50 md:max-w-[240px]"
            />
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#10201e] md:ml-auto"
            >
              Add topic
            </button>
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

        {isTheory ? (
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
                      to={`/learning/${slug}/${section}/${item.parentId}/${item._id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal/20 bg-[#171c2a]/80 px-3 py-2.5 text-sm hover:border-teal/40"
                    >
                      <span>
                        <span className="font-medium">{item.title}</span>
                        <span className="ml-2 text-xs text-muted">
                          in {item.parentTitle}
                        </span>
                      </span>
                      <span className="text-[11px] text-teal">Open →</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-teal/25 px-3 py-4 text-sm text-muted">
                  Subtopics you mark Add to review in a notebook will land
                  here.
                </li>
              )}
            </ul>
          </div>
        ) : null}

        <ul className="mt-6 space-y-3">
          {filtered.map((topic) => {
            const opened = showTree
              ? openIds[topic._id] !== false
              : Boolean(openIds[topic._id]);
            return (
              <li
                key={topic._id}
                className={`rounded-2xl border bg-[#222838]/80 px-4 py-4 ${
                  topic.highlighted
                    ? "border-gold/40 shadow-[0_0_20px_rgba(232,195,106,0.12)]"
                    : "border-line"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {topic.highlighted ? (
                    <span className="text-gold">
                      <StarIcon filled />
                    </span>
                  ) : (
                    <span className="w-4" />
                  )}
                  <span className="w-8 text-sm text-muted">
                    {String(topic.slNo ?? "").padStart(2, "0")}
                  </span>
                  <Link
                    to={`/learning/${slug}/${section}/${topic._id}`}
                    className="min-w-0 flex-1 text-lg font-medium hover:text-teal"
                  >
                    {topic.title}
                  </Link>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] capitalize ${
                      levelClass[topic.level] || levelClass.medium
                    }`}
                  >
                    {topic.level || "medium"}
                  </span>
                  <span className="text-xs text-muted">
                    {topic.subtopics?.length || 0} {childLabel}
                    {isPractical
                      ? ` · ${topic.questionCount || 0} questions`
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
                </div>

                {opened ? (
                  <div className="mt-4 border-t border-line pt-3">
                    {topic.subtopics?.length ? (
                      <ul className="space-y-1.5">
                        {topic.subtopics.map((sub, index) => (
                          <li key={sub._id}>
                            <Link
                              to={`/learning/${slug}/${section}/${topic._id}/${sub._id}`}
                              className="flex items-center gap-3 rounded-xl bg-[#171c2a] px-3 py-2 text-sm hover:bg-white/5"
                            >
                              <span className="w-6 text-xs text-muted">
                                {String(sub.slNo ?? index + 1).padStart(2, "0")}
                              </span>
                              <span className="min-w-0 flex-1">{sub.title}</span>
                              {sub.nested?.length ? (
                                <span className="text-[10px] text-gold">
                                  {sub.nested.length} in note
                                </span>
                              ) : null}
                              {sub.inReview ? (
                                <span className="text-[10px] text-teal">review</span>
                              ) : null}
                              {isPractical && sub.questionCount ? (
                                <span className="text-[10px] text-muted">
                                  {sub.questionCount} questions
                                </span>
                              ) : null}
                            </Link>
                            {sub.nested?.length ? (
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
                        No {childLabel} under this topic yet.
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="page-aside">
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
          ) : null}
        </div>
        <Link
          to={`/learning/${slug}/${isPractical ? "theory" : "practical"}`}
          className="mt-8 inline-block text-xs text-cyan hover:underline"
        >
          Switch to {isPractical ? "Theory" : "Practical"}
        </Link>
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
    </div>
  );
}
