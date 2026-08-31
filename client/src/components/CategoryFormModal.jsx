import { useEffect, useRef, useState } from "react";
import { createTodoCategory, updateTodoCategory } from "../api.js";

export const CATEGORY_PALETTE = [
  "#6ec8ff",
  "#3ce6d4",
  "#b9a6ff",
  "#e8c36a",
  "#e88b7a",
  "#a8e890",
  "#f0a0d0",
  "#ffb347",
];

export default function CategoryFormModal({
  category = null,
  onClose,
  onSaved,
  onDelete,
}) {
  const editing = Boolean(category);
  const [name, setName] = useState(category?.name || "");
  const [emoji, setEmoji] = useState(category?.emoji || "");
  const [color, setColor] = useState(category?.color || CATEGORY_PALETTE[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { name: trimmed, emoji: emoji.trim(), color };
      const result = editing
        ? await updateTodoCategory(category._id, payload)
        : await createTodoCategory(payload);
      onSaved(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[#0b0f18]/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-[#1e2638] p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold">
          {editing ? "Edit Category" : "New Category"}
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🏷"
              maxLength={4}
              className="w-16 rounded-xl bg-white/5 px-2 py-2 text-center text-lg outline-none ring-1 ring-line focus:ring-cyan/40"
            />
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name (e.g. Work)"
              className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-ink placeholder-muted outline-none ring-1 ring-line focus:ring-cyan/40"
            />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">Color</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? "border-ink scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: `${color}12`, border: `1px solid ${color}30` }}
          >
            <span className="text-lg">{emoji || "🏷"}</span>
            <span className="text-sm font-medium" style={{ color }}>
              {name || "Preview"}
            </span>
          </div>

          {error ? <p className="text-xs text-coral">{error}</p> : null}

          <div className="flex items-center justify-between gap-2 pt-1">
            {editing && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg px-3 py-1.5 text-xs text-coral hover:bg-coral/10"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-white/5 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg px-4 py-1.5 text-xs font-medium text-[#0b0f18] disabled:opacity-50"
                style={{ background: color }}
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
