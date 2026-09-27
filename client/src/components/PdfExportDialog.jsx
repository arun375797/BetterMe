import { useMemo, useState } from "react";
import { getQuestions } from "../api.js";
import { downloadQuestionPdf } from "../lib/questionPdf.js";

const topicLevels = [
  { value: "all", label: "All topic levels" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const questionDifficulties = [
  { value: "all", label: "All question difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "ec", label: "Edge case" },
];

export default function PdfExportDialog({
  subject,
  section,
  visibleTopics,
  allTopics,
  query,
  onClose,
}) {
  const [scope, setScope] = useState("visible");
  const [topicLevel, setTopicLevel] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [includeEmptySubtopics, setIncludeEmptySubtopics] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedTopics = useMemo(() => {
    const source = scope === "visible" ? visibleTopics : allTopics;
    return source.filter((topic) => {
      if (topicLevel !== "all" && (topic.level || "medium") !== topicLevel) {
        return false;
      }
      if (starredOnly && !topic.highlighted) return false;
      return true;
    });
  }, [scope, visibleTopics, allTopics, topicLevel, starredOnly]);

  async function exportPdf() {
    if (!selectedTopics.length) {
      setError("No topics match these export filters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const groups = await Promise.all(
        selectedTopics.map(async (topic) => {
          const subtopics = topic.subtopics || [];
          const [topicQuestions, ...subtopicQuestions] = await Promise.all([
            getQuestions(topic._id),
            ...subtopics.map((subtopic) => getQuestions(subtopic._id)),
          ]);
          const keep = (question) =>
            difficulty === "all" || (question.difficulty || "medium") === difficulty;
          return {
            slNo: topic.slNo,
            title: topic.title,
            questions: (topicQuestions || []).filter(keep),
            subtopics: subtopics
              .map((subtopic, index) => ({
                title: subtopic.title,
                questions: (subtopicQuestions[index] || []).filter(keep),
              }))
              .filter(
                (subtopic) =>
                  includeEmptySubtopics || subtopic.questions.length
              ),
          };
        })
      );
      await downloadQuestionPdf({
        subjectName: subject.shortName || subject.name || subject.title || subject.slug,
        section,
        groups,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Could not create the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-export-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-raised p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-teal uppercase">PDF export</p>
            <h3 id="pdf-export-title" className="mt-1 text-xl font-semibold">
              Download questions
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              Compact layout: topic, optional subtopic, then its questions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-muted hover:text-ink disabled:opacity-50"
            aria-label="Close PDF options"
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <label className="grid gap-1.5 text-xs text-muted">
            Topics
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-teal/50"
            >
              <option value="visible">
                Current filter{query.trim() ? `: “${query.trim()}”` : ""} ({visibleTopics.length})
              </option>
              <option value="all">All topics ({allTopics.length})</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs text-muted">
              Topic level
              <select
                value={topicLevel}
                onChange={(event) => setTopicLevel(event.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-teal/50"
              >
                {topicLevels.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs text-muted">
              Question difficulty
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-teal/50"
              >
                {questionDifficulties.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={starredOnly}
              onChange={(event) => setStarredOnly(event.target.checked)}
              className="accent-[#18d8d2]"
            />
            Starred topics only
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={includeEmptySubtopics}
              onChange={(event) => setIncludeEmptySubtopics(event.target.checked)}
              className="accent-[#18d8d2]"
            />
            Include subtopic headings with no questions
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted">{selectedTopics.length} topics selected</p>
          <button
            type="button"
            onClick={exportPdf}
            disabled={busy || !selectedTopics.length}
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#10201e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2h14v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {busy ? "Building PDF…" : "Download PDF"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-coral" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
