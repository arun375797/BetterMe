import { useState } from "react";
import { DIFFICULTIES } from "../difficulty.js";
import { Dialog, DialogFooter, DialogHeader } from "./Dialog.jsx";
import IdeEditor from "./IdeEditor.jsx";

const LANGS = ["javascript", "python", "html", "css", "json", "text"];

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50";

function newSolution() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    language: "javascript",
    code: "",
    logic: "",
  };
}

function initialSolutions(initial) {
  if (Array.isArray(initial?.solutions) && initial.solutions.length) {
    return initial.solutions.map((item) => ({
      id: item.id || item._id || newSolution().id,
      language: item.language || "javascript",
      code: item.code || "",
      logic: item.logic || "",
    }));
  }
  if (initial?.code || initial?.notes) {
    return [
      {
        id: "legacy",
        language: initial.language || "javascript",
        code: initial.code || "",
        logic: initial.notes || "",
      },
    ];
  }
  return [newSolution()];
}

export default function QuestionFormModal({
  heading = "New question",
  submitLabel = "Save question",
  initial,
  sections = [],
  currentSectionId,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [prompt, setPrompt] = useState(initial?.prompt || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "medium");
  const [solutions, setSolutions] = useState(() => initialSolutions(initial));
  const relatedId =
    initial?.relatedSection?._id || initial?.relatedSection || "";
  const [relatedSectionId, setRelatedSectionId] = useState(relatedId || "");
  const [saving, setSaving] = useState(false);

  const otherSections = sections.filter(
    (item) => String(item._id) !== String(currentSectionId)
  );

  function patchSolution(id, patch) {
    setSolutions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        prompt,
        difficulty,
        solutions,
        relatedSectionId: relatedSectionId || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog size="wide" onClose={onClose}>
      <DialogHeader
        kicker={heading}
        title={initial?._id ? "Edit question" : "Add question"}
        onClose={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.65fr)_300px]"
      >
        <div className="min-h-0 space-y-4 overflow-auto border-b border-white/8 p-4 sm:p-6 lg:border-r lg:border-b-0">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Title</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reverse a string"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Question</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="The question only — constraints or expected output."
              className={`${fieldClass} resize-y leading-6`}
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs text-muted">Difficulty</span>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficulty(item.id)}
                  className={`rounded-xl border px-3 py-1.5 text-sm ${
                    difficulty === item.id
                      ? item.className
                      : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {solutions.map((item, index) => (
              <div
                key={item.id}
                className="space-y-3 rounded-2xl border border-white/8 bg-[#171c2a]/70 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">Way {index + 1}</p>
                  <select
                    value={item.language}
                    onChange={(e) =>
                      patchSolution(item.id, { language: e.target.value })
                    }
                    className="rounded-lg border border-line bg-[#121826] px-2 py-1 text-xs"
                  >
                    {LANGS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  {solutions.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSolutions((prev) =>
                          prev.filter((row) => row.id !== item.id)
                        )
                      }
                      className="ml-auto text-xs text-coral/80 hover:text-coral"
                    >
                      Remove way
                    </button>
                  ) : null}
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-muted">
                    Logic behind this answer
                  </span>
                  <textarea
                    value={item.logic}
                    onChange={(e) =>
                      patchSolution(item.id, { logic: e.target.value })
                    }
                    rows={3}
                    placeholder="Explain why this solution works."
                    className={`${fieldClass} resize-y leading-6`}
                  />
                </label>
                <div>
                  <span className="mb-1.5 block text-xs text-muted">Code</span>
                  <div className="overflow-hidden rounded-xl border border-line">
                    <IdeEditor
                      compact
                      value={item.code}
                      onChange={(code) => patchSolution(item.id, { code })}
                      placeholder="// answer"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSolutions((prev) => [...prev, newSolution()])}
              className="rounded-xl border border-dashed border-line px-4 py-2 text-sm text-muted hover:border-teal/40 hover:text-teal"
            >
              Add another way
            </button>
          </div>
        </div>

        <div className="flex flex-col bg-[#171c2a]/50 p-4 sm:p-6">
          <p className="text-[11px] tracking-[0.18em] text-gold uppercase">
            Related section
          </p>
          <h4 className="mt-1 text-lg font-semibold">Not part of the question</h4>
          <p className="mt-2 text-sm leading-6 text-muted">
            Optional pointer to another section under this topic. It is not
            mixed into the question text and does not move this question.
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs text-muted">
              Related section
            </span>
            <select
              value={relatedSectionId}
              onChange={(e) => setRelatedSectionId(e.target.value)}
              className={fieldClass}
            >
              <option value="">None</option>
              {otherSections.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          {otherSections.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line px-3 py-3 text-sm text-muted">
              No other sections yet.
            </p>
          ) : null}
        </div>
        <div className="lg:col-span-2">
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/6"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e] disabled:opacity-50"
            >
              {saving ? "Saving…" : submitLabel}
            </button>
          </DialogFooter>
        </div>
      </form>
    </Dialog>
  );
}
