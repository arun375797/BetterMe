import { useRef, useState } from "react";
import { MusicTransport } from "./MusicControl.jsx";
import { useMusicPlayer } from "../context/MusicPlayerContext.jsx";

function formatTime(seconds) {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MusicProgress({ compact = false, showTitle = false }) {
  const { track, progress, seek } = useMusicPlayer();
  const barRef = useRef(null);
  const dragging = useRef(false);

  if (!track) return null;

  const duration = progress.duration || 0;
  const current = progress.current || 0;
  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  function secondsAt(event) {
    const bar = barRef.current;
    if (!bar || duration <= 0) return 0;
    const point = event.touches?.[0] || event.changedTouches?.[0] || event;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (point.clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function onPointerDown(event) {
    if (duration <= 0) return;
    dragging.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    seek(secondsAt(event));
  }

  function onPointerMove(event) {
    if (!dragging.current) return;
    seek(secondsAt(event));
  }

  function onPointerUp() {
    dragging.current = false;
  }

  const knob = compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const line = compact ? "h-[3px]" : "h-1.5";

  return (
    <div className={compact ? "min-w-0" : "min-w-0 w-full"}>
      {showTitle ? (
        <p className={`truncate ${compact ? "mb-1 text-[10px] text-muted" : "mb-2 text-sm font-medium"}`}>
          {track.title}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        {compact ? null : (
          <span className="hidden w-8 shrink-0 text-right text-[11px] tabular-nums text-muted sm:block">
            {formatTime(current)}
          </span>
        )}
        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label="Song position"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`relative min-w-0 flex-1 cursor-pointer py-2 ${compact ? "" : ""}`}
        >
          <div className={`relative w-full rounded-full bg-white/12 ${line}`}>
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-teal"
              style={{ width: `${pct}%` }}
            />
            <span
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#171c2a] bg-teal shadow-[0_0_0_1px_rgba(60,230,212,0.35)] ${knob}`}
              style={{ left: `${pct}%` }}
            />
          </div>
        </div>
        {compact ? null : (
          <span className="hidden w-8 shrink-0 text-[11px] tabular-nums text-muted sm:block">
            {formatTime(duration)}
          </span>
        )}
      </div>
      {compact ? (
        <div className="mt-1 flex justify-center">
          <MusicTransport compact />
        </div>
      ) : null}
    </div>
  );
}

export function MusicNowPlaying({ compact = false, className = "" }) {
  const { track, playing } = useMusicPlayer();
  const [open, setOpen] = useState(false);

  if (!track) return null;

  if (!compact) {
    return (
      <div className={className}>
        <MusicProgress compact={compact} showTitle />
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Hide player" : "Show player"}
        className="flex w-full min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-left text-muted hover:bg-white/5 hover:text-ink"
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            playing ? "bg-teal" : "bg-white/25"
          }`}
        />
        <span className="min-w-0 flex-1 truncate text-[11px]">{track.title}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
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
      </button>
      {open ? (
        <div className="mt-1">
          <MusicProgress compact showTitle={false} />
        </div>
      ) : null}
    </div>
  );
}
