import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getReviewQueue, peekReviewQueue } from "../api.js";
import { difficultyMeta } from "../difficulty.js";
import { accentMap } from "../theme.jsx";

function notebookPath(item) {
  const slug = item.subject?.slug;
  const section = item.section || "theory";
  const parentId = item.parentTopic?._id || item.parent;
  if (!slug || !parentId) return "/learning";
  return `/learning/${slug}/${section}/${parentId}/${item._id}`;
}

export default function LearningHome() {
  const { subjects } = useOutletContext();
  const [review, setReview] = useState(() => peekReviewQueue() || []);
  const totals = subjects.reduce(
    (acc, s) => {
      acc.theory += s.stats?.theory?.mainTopics || 0;
      acc.practical += s.stats?.practical?.mainTopics || 0;
      acc.inReview += s.stats?.inReview || 0;
      return acc;
    },
    { theory: 0, practical: 0, inReview: 0 }
  );

  useEffect(() => {
    getReviewQueue()
      .then(setReview)
      .catch(() => setReview([]));
  }, []);

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          BetterMe · Learning
        </p>
        <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">Pick a track and keep going</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          JS, Mongo, Node, React and DSA. Open a subject, then choose Theory or
          Practical. Sugar tracking is live under My Health.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {["bootcamp", "mern", "daily grind"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line bg-white/4 px-3 py-1 text-[11px] tracking-wide text-muted uppercase"
            >
              {tag}
            </span>
          ))}
        </div>

        {review.length ? (
          <div className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
                  Review
                </p>
                <h3 className="mt-1 text-xl font-semibold">In your queue</h3>
              </div>
              <span className="text-xs text-teal">{review.length} items</span>
            </div>
            <ul className="mt-4 space-y-2">
              {review.map((item) => (
                <li key={item._id}>
                  <Link
                    to={notebookPath(item)}
                    className="flex flex-wrap items-start gap-3 rounded-2xl border border-line bg-[#222838]/80 px-4 py-3 transition hover:border-white/15 sm:items-center"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-medium">{item.title}</span>
                      <span className="text-xs text-muted">
                        {item.subject?.shortName || item.subject?.name} ·{" "}
                        {item.parentTopic?.title || "Topic"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
                        difficultyMeta(item.difficulty).className
                      }`}
                    >
                      {difficultyMeta(item.difficulty).label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => {
            const accent = accentMap[subject.accent] || accentMap.teal;
            return (
              <Link
                key={subject.slug}
                to={`/learning/${subject.slug}`}
                className={`rounded-2xl border border-line bg-[#222838]/80 p-5 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:border-white/15 ${accent.glow}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${accent.text}`}>
                      {subject.shortName}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold break-words">{subject.name}</h3>
                  </div>
                  <span className="shrink-0 rounded-lg bg-white/6 px-2 py-1 text-xs">
                    Theory · Practical
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {subject.description}
                </p>
                <p className="mt-4 text-xs text-muted">
                  Theory {subject.stats?.theory?.mainTopics ?? 0} · Practical{" "}
                  {subject.stats?.practical?.mainTopics ?? 0}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="page-aside">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          Snapshot
        </p>
        <h3 className="mt-2 text-lg font-semibold">This section</h3>

        <div className="mt-6 space-y-5">
          <Stat label="Theory topics" value={totals.theory} />
          <Stat label="Practical topics" value={totals.practical} teal />
          <Stat label="In review" value={totals.inReview} teal />
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-white/4 p-4 text-sm text-muted">
          Mark a subsection as Hard or Add to review from its notebook. Those
          notes show up here so you can restudy them without hunting the tree.
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value, teal }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={teal ? "text-teal" : ""}>{value}</span>
    </div>
  );
}
