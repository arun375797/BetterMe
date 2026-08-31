import { useState } from "react";
import { Dialog } from "./Dialog.jsx";

const ACCENTS = [
  { id: "gold", label: "Gold" },
  { id: "teal", label: "Teal" },
  { id: "coral", label: "Coral" },
  { id: "cyan", label: "Cyan" },
  { id: "violet", label: "Violet" },
];

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-gold/50";

export default function BookFormModal({ book, onClose, onSubmit }) {
  const editing = Boolean(book);
  const [title, setTitle] = useState(book?.title || "");
  const [description, setDescription] = useState(book?.description || "");
  const [accent, setAccent] = useState(book?.accent || "gold");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give this notebook a name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        accent,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog size="form" onClose={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="border-b border-line px-6 py-4">
          <p className="text-[11px] tracking-[0.18em] text-muted uppercase">
            My Notebooks
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {editing ? "Edit notebook" : "New notebook"}
          </h3>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block text-xs text-muted">
            Name
            <input
              className={`${fieldClass} mt-1.5`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Personal data, Passwords, Ideas…"
              autoFocus
            />
          </label>
          <label className="block text-xs text-muted">
            What it is for
            <textarea
              className={`${fieldClass} mt-1.5 min-h-[80px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about this book"
            />
          </label>
          <div>
            <p className="text-xs text-muted">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAccent(item.id)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                    accent === item.id
                      ? "border-gold/40 bg-gold/15 text-gold"
                      : "border-line text-muted hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#1b2030] disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save" : "Create notebook"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
