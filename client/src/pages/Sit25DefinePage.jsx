import { useEffect, useState } from "react";
import {
  createSitBreakVideo,
  deleteSitBreakVideo,
  getSitBreakVideos,
  peek,
  updateSitBreakVideo,
} from "../api.js";
import {
  formatWatchTime,
  parseYoutubeId,
  secondsToMinutesInput,
  youtubeThumb,
} from "../lib/youtube.js";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50";

const emptyForm = {
  title: "",
  youtubeUrl: "",
  durationMinutes: "",
};

export default function Sit25DefinePage() {
  const [videos, setVideos] = useState(
    () => peek("/api/sit-break", "/")?.videos || []
  );
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await getSitBreakVideos();
    setVideos(data.videos || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function startEdit(video) {
    setEditingId(video._id);
    setForm({
      title: video.title || "",
      youtubeUrl: video.youtubeUrl || `https://www.youtube.com/watch?v=${video.youtubeId}`,
      durationMinutes: secondsToMinutesInput(video.durationSeconds),
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const title = form.title.trim();
    const youtubeId = parseYoutubeId(form.youtubeUrl);
    if (!title) {
      setError("Give this a title.");
      return;
    }
    if (!youtubeId) {
      setError("Paste a valid YouTube link.");
      return;
    }
    const payload = {
      title,
      youtubeUrl: form.youtubeUrl.trim(),
      durationMinutes:
        form.durationMinutes === "" ? "" : Number(form.durationMinutes),
    };
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateSitBreakVideo(editingId, payload);
      } else {
        await createSitBreakVideo(payload);
      }
      await load();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(video) {
    if (!confirm(`Remove “${video.title}”?`)) return;
    try {
      await deleteSitBreakVideo(video._id);
      if (editingId === video._id) resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-pad mx-auto max-w-3xl">
      <h2 className="text-2xl font-semibold">
        {editingId ? "Edit video" : "Add a video"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        Title, YouTube link, and how long it takes. It shows up on Break right
        away. Add as many as you want.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Title</span>
          <input
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="e.g. Hip flexor reset"
            className={fieldClass}
            maxLength={120}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">YouTube link</span>
          <input
            value={form.youtubeUrl}
            onChange={(e) =>
              setForm((current) => ({ ...current, youtubeUrl: e.target.value }))
            }
            placeholder="https://www.youtube.com/watch?v=…"
            className={fieldClass}
            required
          />
        </label>
        <label className="block max-w-[10rem]">
          <span className="mb-1.5 block text-xs text-muted">Minutes</span>
          <input
            type="number"
            min="1"
            max="120"
            value={form.durationMinutes}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                durationMinutes: e.target.value,
              }))
            }
            placeholder="8"
            className={fieldClass}
          />
        </label>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#10201e] disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add video"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-white/6"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <h3 className="mt-10 text-sm font-medium text-muted">
        On Break ({videos.length})
      </h3>
      <ul className="mt-3 space-y-2">
        {videos.map((video) => {
          const time = formatWatchTime(video.durationSeconds);
          return (
            <li
              key={video._id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-[#171c2a] p-2 pr-3"
            >
              <img
                src={youtubeThumb(video.youtubeId)}
                alt=""
                className="h-14 w-[5.6rem] shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{video.title}</p>
                {time ? <p className="text-xs text-muted">{time}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => startEdit(video)}
                className="rounded-lg px-2.5 py-1 text-xs text-muted hover:bg-white/6 hover:text-ink"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(video)}
                className="rounded-lg px-2.5 py-1 text-xs text-muted hover:bg-coral/15 hover:text-coral"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
