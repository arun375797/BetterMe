import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createNamasteDevVideo,
  getNamasteDev,
  peekNamasteDev,
  updateNamasteDevVideo,
} from "../api.js";
import FavoriteButton from "../components/FavoriteButton.jsx";
import { formatDuration } from "../lib/duration.js";
import { accentMap } from "../theme.jsx";

const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-3 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-violet/50";

function VideoRow({
  video,
  longest,
  busy,
  editing,
  editTitle,
  editDuration,
  setEditTitle,
  setEditDuration,
  onStart,
  onSave,
  onToggle,
}) {
  const width =
    longest > 0 && video.durationSeconds
      ? Math.max(4, (video.durationSeconds / longest) * 100)
      : 0;

  if (editing) {
    return (
      <li className="rounded-xl border border-line bg-[#222838]/80 px-3 py-2">
        <form
          className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(video);
          }}
        >
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={fieldClass}
          />
          <input
            value={editDuration}
            onChange={(e) => setEditDuration(e.target.value)}
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={Boolean(busy)}
            className="rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-[#16122a]"
          >
            Save
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-line bg-[#222838]/80 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <input
          type="checkbox"
          checked={Boolean(video.done)}
          disabled={Boolean(busy)}
          onChange={() => onToggle(video, { done: !video.done })}
          aria-label={`${video.done ? "Uncheck" : "Check"} ${video.title}`}
          className="h-4 w-4 shrink-0 accent-teal"
        />
        <span className="w-8 shrink-0 text-xs tabular-nums text-muted">
          {video.slNo}
        </span>
        <button
          type="button"
          onClick={() => onStart(video)}
          className={`min-w-0 flex-1 truncate text-left text-sm font-medium ${
            video.done ? "text-muted line-through" : ""
          }`}
        >
          {video.title}
        </button>
        <span className="shrink-0 tabular-nums text-xs text-violet sm:text-sm">{video.duration}</span>
        <FavoriteButton
          compact
          on={Boolean(video.favorite)}
          onClick={() => onToggle(video, { favorite: !video.favorite })}
        />
      </div>
      <div className="mt-1.5 ml-10 h-1 overflow-hidden rounded-sm bg-[#171c2a]">
        <span className="block h-full bg-violet" style={{ width: `${width}%` }} />
      </div>
    </li>
  );
}

function patchCourse(course, id, fields) {
  const apply = (video) =>
    String(video._id) === String(id) ? { ...video, ...fields } : video;
  return {
    ...course,
    videos: (course.videos || []).map(apply),
    sections: (course.sections || []).map((group) => ({
      ...group,
      videos: group.videos.map(apply),
    })),
  };
}

export default function NamasteDevPage() {
  const accent = accentMap.violet;
  const [course, setCourse] = useState(() => peekNamasteDev() || null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [busy, setBusy] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");

  useEffect(() => {
    let live = true;
    getNamasteDev()
      .then((data) => {
        if (!live) return;
        setCourse(data);
        setError("");
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, []);

  const videos = course?.videos || [];
  const sections = course?.sections || [];
  const longest = course?.longestSeconds || 0;
  const doneCount = videos.filter((video) => video.done).length;

  async function addVideo(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy("add");
    try {
      const next = await createNamasteDevVideo({
        title: title.trim(),
        duration,
      });
      setCourse(next);
      setTitle("");
      setDuration("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function startEdit(video) {
    setEditingId(video._id);
    setEditTitle(video.title);
    setEditDuration(
      video.durationSeconds == null
        ? ""
        : video.duration || formatDuration(video.durationSeconds)
    );
  }

  async function saveEdit(video) {
    setBusy(video._id);
    try {
      const next = await updateNamasteDevVideo(video._id, {
        title: editTitle.trim(),
        duration: editDuration,
      });
      setCourse(next);
      setEditingId("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function toggleVideo(video, fields) {
    const previous = course;
    setCourse((current) => patchCourse(current, video._id, fields));
    setBusy(video._id);
    try {
      const next = await updateNamasteDevVideo(video._id, fields);
      setCourse(next);
      setError("");
    } catch (err) {
      setCourse(previous);
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (!course && !error) {
    return <p className="page-pad text-muted">Loading…</p>;
  }

  return (
    <div className="page-pad">
      <p className={`text-[12px] tracking-[0.18em] uppercase ${accent.text}`}>
        <Link to="/learning/dsa" className="hover:underline">
          DSA
        </Link>
        {" · Namaste Dev"}
      </p>
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Namaste Dev</h2>
      <p className="mt-2 font-medium tabular-nums">
        {doneCount}/{videos.length} · {course?.total || "0:00"}
      </p>
      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

      <div className="mt-8 space-y-2">
        {sections.map((group) => {
          const groupDone = group.videos.filter((video) => video.done).length;
          return (
            <details
              key={group.name}
              className="group rounded-2xl border border-line bg-[#222838]/80"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path
                    d="M5 8l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="min-w-0 flex-1 truncate text-lg font-semibold">
                  {group.name}
                </h3>
                <p className="shrink-0 text-xs tabular-nums text-muted sm:text-sm">
                  {groupDone}/{group.videos.length} · {group.total}
                </p>
              </summary>
              <ol className="space-y-1.5 px-3 pb-3">
                {group.videos.map((video) => (
                  <VideoRow
                    key={video._id}
                    video={video}
                    longest={longest}
                    busy={busy}
                    editing={editingId === video._id}
                    editTitle={editTitle}
                    editDuration={editDuration}
                    setEditTitle={setEditTitle}
                    setEditDuration={setEditDuration}
                    onStart={startEdit}
                    onSave={saveEdit}
                    onToggle={toggleVideo}
                  />
                ))}
              </ol>
            </details>
          );
        })}
      </div>

      <form
        onSubmit={addVideo}
        className="mt-8 grid gap-2 sm:grid-cols-[1fr_140px_auto]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Video name"
          className={fieldClass}
        />
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="1:23:45"
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={Boolean(busy) || !title.trim()}
          className="rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-[#16122a] disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
