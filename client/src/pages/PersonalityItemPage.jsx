import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { PERSONALITY_SECTIONS } from "../personality.js";
import {
  deletePersonalityItem,
  getPersonalityItem,
  updatePersonalityItem,
} from "../api.js";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-violet/50";

export default function PersonalityItemPage() {
  const { refreshPersonality } = useOutletContext();
  const { section, itemId } = useParams();
  const navigate = useNavigate();
  const meta = PERSONALITY_SECTIONS[section];
  const [item, setItem] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState("want");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPersonalityItem(itemId)
      .then((data) => {
        if (cancelled) return;
        setItem(data);
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setStatus(data.status || "want");
        setDetails(data.details || "");
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (!meta) {
    return (
      <div className="page-pad text-sm text-muted">Section not found.</div>
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updatePersonalityItem(itemId, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        details,
        status: section === "books" ? status : "want",
      });
      setItem(updated);
      refreshPersonality?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deletePersonalityItem(itemId);
    refreshPersonality?.();
    navigate(`/personality/${section}`);
  }

  return (
    <div className="page-pad">
      <Link
        to={`/personality/${section}`}
        className="text-sm text-muted hover:text-ink"
      >
        ← {meta.label}
      </Link>
      <p className="mt-4 text-[12px] tracking-[0.18em] text-violet uppercase">
        My Personality · {meta.label}
      </p>
      <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">
        {item?.title || "Loading…"}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Add or edit the details for this {meta.itemLabel.toLowerCase()}.
      </p>

      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      {item ? (
        <div className="mt-8 max-w-3xl space-y-4">
          <label className="block text-xs text-muted">
            Name
            <input
              className={`${fieldClass} mt-1.5`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          <label className="block text-xs text-muted">
            Details
            <textarea
              className={`${fieldClass} mt-1.5 min-h-[280px]`}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={meta.detailsPlaceholder}
            />
          </label>
          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl px-3 py-2 text-sm text-coral hover:bg-coral/10"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-[#1b2030] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save details"}
            </button>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          title={`Delete “${item?.title}”?`}
          message="This card and its details will be removed."
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
