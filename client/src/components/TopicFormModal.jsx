import { useState } from "react";
import { Dialog, DialogFooter, DialogHeader } from "./Dialog.jsx";

const LEVELS = ["low", "medium", "hard"];

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50";

export function StarIcon({ filled, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3.2 2.47 5.64 6.16.62-4.64 4.12 1.38 6.04L12 16.7 6.63 19.62l1.38-6.04-4.64-4.12 6.16-.62L12 3.2z" />
    </svg>
  );
}

export default function TopicFormModal({
  heading = "New main topic",
  submitLabel = "Save topic",
  initial,
  nextSlNo = 1,
  showHighlight = false,
  showLevel = true,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [level, setLevel] = useState(initial?.level || "medium");
  const [slNo, setSlNo] = useState(String(initial?.slNo ?? nextSlNo));
  const [highlighted, setHighlighted] = useState(
    Boolean(initial?.highlighted)
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        level,
        slNo: Number(slNo) || nextSlNo,
        highlighted,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog size="form" onClose={onClose}>
      <DialogHeader
        kicker={heading}
        title={initial?._id ? "Update" : "Add"}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Name</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Functions"
              className={fieldClass}
            />
          </label>

          {showLevel ? (
            <div>
              <span className="mb-1.5 block text-xs text-muted">Level</span>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLevel(item)}
                    className={`rounded-xl border px-3 py-2 text-sm capitalize ${
                      level === item
                        ? "border-teal/50 bg-teal/15 text-ink"
                        : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Serial no.</span>
            <input
              type="number"
              min="1"
              value={slNo}
              onChange={(e) => setSlNo(e.target.value)}
              className={fieldClass}
            />
          </label>

          {showHighlight ? (
            <button
              type="button"
              onClick={() => setHighlighted((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                highlighted
                  ? "border-gold/50 bg-gold/12 text-gold"
                  : "border-line bg-[#171c2a] text-muted"
              }`}
            >
              <StarIcon filled={highlighted} />
              <span>
                {highlighted
                  ? "Highlighted — this topic stays at the top"
                  : "Mark as highlight (star, pin to top)"}
              </span>
            </button>
          ) : null}
        </div>
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
      </form>
    </Dialog>
  );
}
