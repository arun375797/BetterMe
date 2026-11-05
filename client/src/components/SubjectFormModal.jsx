import { useState } from "react";
import { Dialog, DialogFooter, DialogHeader } from "./Dialog.jsx";
import { accentMap } from "../theme.jsx";

const fieldClass = "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50";

export default function SubjectFormModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState("teal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), shortName: shortName.trim(), description: description.trim(), accent });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog onClose={saving ? undefined : onClose}>
      <DialogHeader kicker="Learning" title="Add language or subject" onClose={saving ? undefined : onClose} />
      <form onSubmit={submit}>
        <fieldset disabled={saving} className="space-y-4 px-6 py-5 disabled:opacity-60">
          <p className="text-sm text-muted">Create a space for theory, practical topics, and questions.</p>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Name</span>
            <input autoFocus required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Python, Java, C++" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Sidebar label (optional)</span>
            <input maxLength={24} value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder={name.trim().slice(0, 24) || "e.g. Python"} className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Description (optional)</span>
            <textarea maxLength={500} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
          </label>
          <div>
            <span className="mb-2 block text-xs text-muted">Color</span>
            <div className="flex gap-3">
              {Object.entries(accentMap).map(([color, style]) => (
                <button key={color} type="button" aria-label={color} aria-pressed={accent === color} onClick={() => setAccent(color)} className={`flex h-9 w-9 items-center justify-center rounded-full ${style.bar} ${accent === color ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : "opacity-60"}`}>
                  {accent === color ? <span aria-hidden="true" className="text-black">✓</span> : null}
                </button>
              ))}
            </div>
          </div>
        </fieldset>
        {error ? <p role="alert" className="px-6 pb-4 text-sm text-coral">{error}</p> : null}
        <DialogFooter>
          <button type="button" disabled={saving} onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/6">Cancel</button>
          <button type="submit" disabled={saving || !name.trim()} className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e] disabled:opacity-50">{saving ? "Adding…" : "Add language"}</button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
