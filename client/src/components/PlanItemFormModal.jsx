import { useState } from "react";
import { todayKey } from "../food.js";
import { Dialog, DialogFooter, DialogHeader } from "./Dialog.jsx";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50";

const PRIORITIES = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

export default function PlanItemFormModal({
  subjects = [],
  lockSubject = false,
  parentTitle = "",
  initial,
  onClose,
  onSubmit,
}) {
  const [subject, setSubject] = useState(
    String(initial?.subject || subjects[0]?._id || "")
  );
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || todayKey());
  const [priority, setPriority] = useState(initial?.priority || "medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const heading = parentTitle
    ? "New subtopic"
    : initial?._id
      ? "Edit topic"
      : "New topic";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !subject || !date) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        subject,
        title: title.trim(),
        date,
        priority,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Dialog size="form" onClose={onClose}>
      <DialogHeader
        kicker="Learning · Plan"
        title={heading}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          {parentTitle ? (
            <p className="text-sm text-muted">
              Under{" "}
              <span className="text-ink">{parentTitle}</span>
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Subject</span>
            <select
              value={subject}
              disabled={lockSubject || Boolean(initial?.parent)}
              onChange={(e) => setSubject(e.target.value)}
              className={fieldClass}
            >
              {subjects.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Topic</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={parentTitle ? "e.g. Map vs filter" : "e.g. Closures"}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs text-muted">Priority</span>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPriority(item.id)}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    priority === item.id
                      ? "border-teal/50 bg-teal/15 text-ink"
                      : "border-line bg-[#171c2a] text-muted hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-coral">{error}</p> : null}
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
            disabled={saving || !title.trim() || !subject || !date}
            className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e] disabled:opacity-50"
          >
            {saving ? "Saving…" : initial?._id ? "Save" : "Add to plan"}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export function PlanProgressLine({ segments = [], accentClass = "bg-teal" }) {
  if (!segments.length) {
    return (
      <div className="h-1.5 w-full rounded-full bg-white/8" aria-hidden />
    );
  }
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/8"
      role="img"
      aria-label={`${segments.filter((s) => s.learned).length} of ${segments.length} studied`}
    >
      {segments.map((seg) => (
        <span
          key={seg.id}
          className={`h-full min-w-0 flex-1 ${
            seg.learned ? accentClass : "bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}
