import { useEffect, useState } from "react";
import { getSitBreakVideos, peek } from "../api.js";
import {
  formatWatchTime,
  youtubeEmbedUrl,
  youtubeThumb,
  youtubeThumbHd,
  youtubeWatchUrl,
} from "../lib/youtube.js";

function Thumb({ id, alt }) {
  const [src, setSrc] = useState(() => youtubeThumbHd(id));
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => {
        const fallback = youtubeThumb(id);
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}

function Player({ video, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const watch = youtubeWatchUrl(video.youtubeId);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0f18]/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{video.title}</p>
        <a
          href={watch}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-white/6 hover:text-ink sm:px-3"
        >
          <span className="sm:hidden">YouTube</span>
          <span className="hidden sm:inline">Open on YouTube</span>
        </a>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/5 text-muted hover:text-ink"
          aria-label="Close player"
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
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-6 sm:px-8">
        <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
          <div className="relative aspect-video w-full">
            <iframe
              title={video.title}
              src={youtubeEmbedUrl(video.youtubeId)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sit25BreakPage() {
  const [videos, setVideos] = useState(
    () => peek("/api/sit-break", "/")?.videos || []
  );
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSitBreakVideos();
        setVideos(data.videos || []);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  return (
    <div className="page-pad mx-auto max-w-6xl">
      <p className="max-w-xl text-sm text-muted">
        Stand up after 25 minutes. Pick one clip, stay gentle, and skip anything
        that sharpens pelvic or hip pain.
      </p>
      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      {videos.length === 0 && !error ? (
        <p className="mt-10 text-sm text-muted">
          No videos yet. Open Define to add a YouTube link.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {videos.map((video) => {
            const time = formatWatchTime(video.durationSeconds);
            return (
              <button
                key={video._id}
                type="button"
                onClick={() => setPlaying(video)}
                className="group overflow-hidden rounded-2xl border border-line bg-[#171c2a] text-left ring-teal/0 transition hover:border-teal/40 hover:ring-1 hover:ring-teal/30"
              >
                <div className="relative aspect-video bg-[#0b0f18]">
                  <Thumb id={video.youtubeId} alt="" />
                  <span className="absolute inset-0 bg-black/15 transition group-hover:bg-black/6" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-teal/50 bg-[#171c2a]/72 text-teal backdrop-blur-sm">
                      <svg viewBox="0 0 20 20" className="ml-0.5 h-5 w-5" fill="currentColor">
                        <path d="M7 5.5v9l8-4.5-8-4.5z" />
                      </svg>
                    </span>
                  </span>
                  {time ? (
                    <span className="absolute right-3 bottom-3 rounded-full bg-[#0b0f18]/78 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur-sm">
                      {time}
                    </span>
                  ) : null}
                </div>
                <div className="px-4 py-3">
                  <h2 className="truncate text-base font-semibold">{video.title}</h2>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {playing ? (
        <Player video={playing} onClose={() => setPlaying(null)} />
      ) : null}
    </div>
  );
}
