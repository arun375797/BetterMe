import { useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { PERSONALITY_SECTIONS } from "../personality.js";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-violet/50";

export default function PersonalityFormModal({
  section,
  onClose,
  onSubmit,
}) {
  const meta = PERSONALITY_SECTIONS[section];
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState("want");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError(`Give this ${meta.itemLabel.toLowerCase()} a name.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        section,
        title: title.trim(),
        subtitle: subtitle.trim(),
        status: section === "books" ? status : "want",
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
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="border-b border-line px-6 py-4">
          <p className="text-[11px] tracking-[0.18em] text-muted uppercase">
            My Personality · {meta.label}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{meta.addLabel}</h3>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block text-xs text-muted">
            Name
            <input
              className={`${fieldClass} mt-1.5`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={meta.itemLabel}
              autoFocus
            />
          </label>
          <label className="block text-xs text-muted">
            {meta.subtitleLabel}
            <input
              className={`${fieldClass} mt-1.5`}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={meta.subtitlePlaceholder}
            />
          </label>
          {section === "books" ? (
            <div>
              <p className="text-xs text-muted">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { id: "want", label: "Want to read" },
                  { id: "read", label: "Have read" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStatus(option.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                      status === option.id
                        ? "border-violet/40 bg-violet/15 text-violet"
                        : "border-line text-muted hover:bg-white/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
            className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-[#1b2030] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
