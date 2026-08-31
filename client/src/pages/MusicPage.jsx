import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MusicTransport } from "../components/MusicControl.jsx";
import MusicProgress from "../components/MusicProgress.jsx";
import { useMusicPlayer } from "../context/MusicPlayerContext.jsx";
import {
  createMusicCategory,
  createMusicTrack,
  deleteMusicCategory,
  deleteMusicTrack,
  getMusicTracks,
  peek,
  updateMusicTrack,
} from "../api.js";
import { parseYoutubeId } from "../lib/youtube.js";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50";

const ALL = "all";
const FAV = "fav";

function Heart({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path
        d="M10 16.2l-1.45-1.32C5.4 12.05 3 9.86 3 7.2A3.2 3.2 0 0 1 6.2 4c1.01 0 1.98.47 2.6 1.22L10 6.5l1.2-1.28A3.18 3.18 0 0 1 13.8 4 3.2 3.2 0 0 1 17 7.2c0 2.66-2.4 4.85-5.55 7.68L10 16.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MusicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const {
    track: current,
    playing,
    shuffle,
    toggle,
    toggleShuffle,
  } = useMusicPlayer();
  const cached = peek("/api/music", "/");
  const [tracks, setTracks] = useState(() => cached?.tracks || []);
  const [categories, setCategories] = useState(() => cached?.categories || []);
  const [filter, setFilter] = useState(ALL);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function apply(data) {
    setTracks(data.tracks || []);
    setCategories(data.categories || []);
  }

  async function load() {
    apply(await getMusicTracks());
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function close() {
    const target =
      from && !String(from).startsWith("/music") ? from : "/today";
    navigate(target);
  }

  const visible = useMemo(() => {
    if (filter === FAV) return tracks.filter((item) => item.favorite);
    if (filter === ALL) return tracks;
    return tracks.filter((item) => String(item.categoryId || "") === filter);
  }, [tracks, filter]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    const youtubeId = parseYoutubeId(youtubeUrl);
    if (!trimmed) {
      setError("Give this a title.");
      return;
    }
    if (!youtubeId) {
      setError("Paste a valid YouTube link.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      apply(
        await createMusicTrack({
          title: trimmed,
          youtubeUrl: youtubeUrl.trim(),
          categoryId: categoryId || null,
        })
      );
      setTitle("");
      setYoutubeUrl("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    try {
      const data = await createMusicCategory({ name });
      apply(data);
      if (data.category?._id) {
        setCategoryId(data.category._id);
        setFilter(String(data.category._id));
      }
      setNewCategory("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCategory(cat) {
    if (!confirm(`Remove category “${cat.name}”? Songs stay, uncategorized.`)) {
      return;
    }
    try {
      apply(await deleteMusicCategory(cat._id));
      if (filter === String(cat._id)) setFilter(ALL);
      if (categoryId === String(cat._id)) setCategoryId("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Remove “${item.title}”?`)) return;
    try {
      apply(await deleteMusicTrack(item._id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFavorite(item) {
    try {
      apply(await updateMusicTrack(item._id, { favorite: !item.favorite }));
    } catch (err) {
      setError(err.message);
    }
  }

  function playItem(item) {
    toggle(item, visible.length ? visible : [item]);
  }

  const chip = (active) =>
    `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-teal/18 text-ink ring-1 ring-teal/35"
        : "text-muted hover:bg-white/6 hover:text-ink"
    }`;

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-[#1b2030]">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-[#171c2a]/96 backdrop-blur-md">
        <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:h-16 sm:gap-3 sm:px-5 sm:py-0">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">Music</p>
            <p className="truncate text-[11px] text-muted">
              Audio only — stays on while you move around
            </p>
          </div>
          <button
            type="button"
            onClick={toggleShuffle}
            title={shuffle ? "Shuffle on" : "Shuffle off"}
            aria-pressed={shuffle}
            aria-label={shuffle ? "Turn shuffle off" : "Turn shuffle on"}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
              shuffle
                ? "border-teal/50 bg-teal/15 text-teal"
                : "border-line bg-white/5 text-muted hover:text-ink"
            }`}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M3 6h3.2l8.3 8H17M3 14h3.2l2.2-2.1M13.5 6H17"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 4.5L17 6l-2 1.5M15 12.5L17 14l-2 1.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close music"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-muted hover:border-teal/40 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-2 px-3 pb-3 sm:px-5">
          {current ? <MusicProgress showTitle /> : null}
          <MusicTransport compact />
        </div>
      </header>

      <main className="page-pad mx-auto w-full max-w-3xl flex-1">
        <div className="sidebar-nav -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <button type="button" onClick={() => setFilter(ALL)} className={chip(filter === ALL)}>
            All
          </button>
          <button type="button" onClick={() => setFilter(FAV)} className={chip(filter === FAV)}>
            Favourites
          </button>
          {categories.map((cat) => {
            const active = filter === String(cat._id);
            return (
              <span key={cat._id} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setFilter(String(cat._id))}
                  className={chip(active)}
                >
                  <span
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: cat.color }}
                  />
                  {cat.name}
                </button>
                {active ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="ml-0.5 rounded-full px-1.5 text-[11px] text-muted hover:text-coral"
                    aria-label={`Delete ${cat.name}`}
                  >
                    ×
                  </button>
                ) : null}
              </span>
            );
          })}
        </div>

        <form onSubmit={handleAddCategory} className="mt-3 flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className={fieldClass}
            maxLength={40}
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-line px-3 py-2.5 text-sm text-muted hover:bg-white/6 hover:text-ink"
          >
            Add
          </button>
        </form>

        <h2 className="mt-8 text-2xl font-semibold">Add a song</h2>
        <p className="mt-2 text-sm text-muted">
          Paste a YouTube link, pick a category, and add it. Only the audio
          plays.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Evening playlist"
              className={fieldClass}
              maxLength={120}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">YouTube link</span>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={fieldClass}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#10201e] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add song"}
          </button>
        </form>

        <h3 className="mt-10 text-sm font-medium text-muted">
          Songs ({visible.length})
        </h3>
        {visible.length === 0 && !error ? (
          <p className="mt-3 text-sm text-muted">
            {filter === FAV
              ? "No favourites yet. Tap the heart on a song."
              : "Nothing in this list yet. Add a YouTube link above."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visible.map((item) => {
              const active = current && String(current._id) === String(item._id);
              const isThisPlaying = active && playing;
              const cat = categories.find(
                (c) => String(c._id) === String(item.categoryId || "")
              );
              return (
                <li
                  key={item._id}
                  className={`flex min-w-0 items-center gap-1.5 rounded-2xl border bg-[#171c2a] p-2.5 sm:gap-2 sm:p-3 ${
                    isThisPlaying
                      ? "border-teal/50 ring-1 ring-teal/30"
                      : "border-line"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-[11px] text-muted">
                      {isThisPlaying ? "Playing" : cat?.name || "No category"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFavorite(item)}
                    aria-label={
                      item.favorite
                        ? `Remove ${item.title} from favourites`
                        : `Add ${item.title} to favourites`
                    }
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      item.favorite
                        ? "text-coral"
                        : "text-muted hover:text-coral"
                    }`}
                  >
                    <Heart filled={item.favorite} />
                  </button>
                  <button
                    type="button"
                    onClick={() => playItem(item)}
                    aria-label={
                      isThisPlaying ? `Pause ${item.title}` : `Play ${item.title}`
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/40 bg-teal/12 text-teal hover:bg-teal/20"
                  >
                    {isThisPlaying ? (
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                        <rect x="5" y="4.5" width="3.4" height="11" rx="1" />
                        <rect x="11.6" y="4.5" width="3.4" height="11" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="ml-0.5 h-4 w-4" fill="currentColor">
                        <path d="M7 5.5v9l8-4.5-8-4.5z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label={`Delete ${item.title}`}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted hover:bg-coral/15 hover:text-coral"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
