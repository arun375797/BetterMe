import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  getReviseQueue,
  peekReviseQueue,
  updateQuestion,
  updateTopic,
} from "../api.js";
import { notebookPath, reviewItemHint } from "../lib/today.js";

function itemType(item) {
  if (item.kind === "question") return "Question";
  return item.parent ? "Subtopic" : "Topic";
}

export default function RevisePage() {
  const { slug, section } = useParams();
  const [queue, setQueue] = useState(() => peekReviseQueue() || []);
  const [loading, setLoading] = useState(!peekReviseQueue());
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setLoading(true);
    getReviseQueue()
      .then((data) => {
        if (!live) return;
        setQueue(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => {
        if (live) setError(err.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const items = useMemo(
    () =>
      queue.filter(
        (item) =>
          item.subject?.slug === slug &&
          (item.section || "theory") === section
      ),
    [queue, slug, section]
  );
  const remainingItems = items.filter((item) => !item.reviseCompleted);
  const completedItems = items.filter((item) => item.reviseCompleted);

  async function toggleCompleted(item) {
    const next = !item.reviseCompleted;
    setQueue((current) =>
      current.map((entry) =>
        String(entry._id) === String(item._id) && entry.kind === item.kind
          ? { ...entry, reviseCompleted: next }
          : entry
      )
    );
    setError("");
    try {
      if (item.kind === "question") {
        await updateQuestion(item._id, { reviseCompleted: next });
      } else {
        await updateTopic(item._id, { reviseCompleted: next });
      }
    } catch (err) {
      setQueue((current) =>
        current.map((entry) =>
          String(entry._id) === String(item._id) && entry.kind === item.kind
            ? { ...entry, reviseCompleted: !next }
            : entry
        )
      );
      setError(err.message || "Could not update the checklist");
    }
  }

  function itemRow(item) {
    return (
      <li key={`${item.kind}-${item._id}`}>
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${
            item.reviseCompleted
              ? "border-violet/25 bg-violet/5"
              : "border-violet/20 bg-raised/80"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleCompleted(item)}
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition ${
              item.reviseCompleted
                ? "border-violet bg-violet text-[#171025]"
                : "border-violet/50 bg-transparent text-transparent hover:bg-violet/10"
            }`}
            aria-label={
              item.reviseCompleted
                ? `Mark ${item.title} as not covered`
                : `Mark ${item.title} as covered`
            }
            title={item.reviseCompleted ? "Mark as not covered" : "Mark as covered"}
          >
            ✓
          </button>
          <Link
            to={notebookPath(item)}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
          >
            <span className="rounded-full border border-violet/25 bg-violet/10 px-2.5 py-1 text-[10px] font-medium tracking-wide text-violet uppercase">
              {itemType(item)}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block break-words font-medium ${
                  item.reviseCompleted ? "text-muted line-through" : ""
                }`}
              >
                {item.title}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {reviewItemHint(item)}
              </span>
            </span>
            <span className="shrink-0 text-xs text-violet">Open →</span>
          </Link>
        </div>
      </li>
    );
  }

  if (section !== "theory" && section !== "practical") {
    return <Navigate to={`/learning/${slug}`} replace />;
  }

  return (
    <div className="page-pad min-h-screen">
      <p className="text-[12px] tracking-[0.18em] text-gold uppercase">
        <Link to={`/learning/${slug}`} className="hover:underline">
          {items[0]?.subject?.shortName || slug}
        </Link>
        {" · "}
        <Link to={`/learning/${slug}/${section}`} className="hover:underline">
          {section === "practical" ? "Practical" : "Theory"}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-violet uppercase">
            Separate from review
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Revise</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Topics, subtopics, and questions you selected for revision. Open any
            item to return to its exact page.
          </p>
        </div>
        <span className="rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-sm text-violet">
          {remainingItems.length} remaining · {items.length} total
        </span>
      </div>

      {error ? <p className="mt-6 text-sm text-coral">{error}</p> : null}
      {loading && !items.length ? (
        <p className="mt-8 text-sm text-muted">Loading revise list…</p>
      ) : (
        <>
          <ul className="mt-8 max-w-4xl space-y-3">
            {remainingItems.length ? (
              remainingItems.map(itemRow)
            ) : items.length ? (
              <li className="rounded-2xl border border-dashed border-violet/25 px-5 py-8 text-center text-sm text-muted">
                Everything in this revise list is covered.
              </li>
            ) : (
              <li className="rounded-2xl border border-dashed border-violet/25 px-5 py-10 text-center text-sm text-muted">
                Nothing has been added for revision yet. Open a topic, subtopic,
                or question and select Add to revise.
              </li>
            )}
          </ul>
          {completedItems.length ? (
            <section className="mt-10 max-w-4xl border-t-2 border-violet/60 pt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-violet uppercase">
                    Covered
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">Completed revision</h2>
                </div>
                <span className="rounded-full bg-violet/10 px-2.5 py-1 text-xs text-violet">
                  {completedItems.length}
                </span>
              </div>
              <ul className="space-y-3">{completedItems.map(itemRow)}</ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
