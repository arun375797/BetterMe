import { Link, useLocation } from "react-router-dom";
import { useMusicPlayer } from "../context/MusicPlayerContext.jsx";

function MusicNoteIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M8 15.5V6.2l8-1.7v9.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.2" cy="15.5" r="2.2" fill="currentColor" />
      <circle cx="14.2" cy="13.8" r="2.2" fill="currentColor" />
    </svg>
  );
}

function PauseIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <rect x="5" y="4.5" width="3.4" height="11" rx="1" />
      <rect x="11.6" y="4.5" width="3.4" height="11" rx="1" />
    </svg>
  );
}

function PlayIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M7 4.8v10.4L16 10 7 4.8z" />
    </svg>
  );
}

function PrevIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4.2 4.5h1.8v11H4.2z" />
      <path d="M16.2 4.7v10.6L7.4 10l8.8-5.3z" />
    </svg>
  );
}

function NextIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M14 4.5h1.8v11H14z" />
      <path d="M3.8 4.7L12.6 10 3.8 15.3V4.7z" />
    </svg>
  );
}

function VolumeIcon({ muted, level, className = "h-5 w-5" }) {
  const quiet = muted || level <= 0;
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M3.2 7.4h2.4L9.2 4.8v10.4L5.6 12.6H3.2V7.4z"
        fill="currentColor"
      />
      {quiet ? (
        <path
          d="M12.2 8.2l4 4M16.2 8.2l-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M12.2 8.2a2.4 2.4 0 0 1 0 3.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {level > 50 ? (
            <path
              d="M14.4 6.4a5 5 0 0 1 0 7.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ) : null}
        </>
      )}
    </svg>
  );
}

const wrap =
  "flex shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-ink ring-teal/0 transition hover:border-teal/40 hover:text-teal hover:ring-2 hover:ring-teal/30 disabled:pointer-events-none disabled:opacity-40";

function VolumeControl({ compact = false, className = "h-8 w-8" }) {
  const { volume, muted, setVolume, toggleMute } = useMusicPlayer();
  const shown = muted ? 0 : volume;
  const size = compact ? "h-7 w-7" : className;
  const icon = compact ? "h-[52%] w-[52%]" : "h-[55%] w-[55%]";

  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${compact ? "w-full" : "max-w-[9.5rem]"}`}>
      <button
        type="button"
        onClick={toggleMute}
        title={muted ? "Unmute" : "Mute"}
        aria-label={muted ? "Unmute" : "Mute"}
        className={`${wrap} ${size}`}
      >
        <VolumeIcon muted={muted} level={shown} className={icon} />
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={shown}
        onChange={(e) => setVolume(e.target.value)}
        aria-label="Volume"
        className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/12 accent-teal touch-manipulation [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal"
      />
    </div>
  );
}

export function MusicTransport({ className = "h-8 w-8", compact = false }) {
  const { track, playing, pause, play, playNext, playPrevious } = useMusicPlayer();
  const size = compact ? "h-7 w-7" : className;
  const icon = compact ? "h-[52%] w-[52%]" : "h-[55%] w-[55%]";
  const disabled = !track;

  function togglePlayback() {
    if (!track) return;
    if (playing) pause();
    else play(track);
  }

  return (
    <div className="flex min-w-0 w-full flex-col items-stretch gap-1.5">
      <div className="flex shrink-0 items-center justify-center gap-1">
        <button
          type="button"
          onClick={playPrevious}
          disabled={disabled}
          title="Previous song"
          aria-label="Previous song"
          className={`${wrap} ${size}`}
        >
          <PrevIcon className={icon} />
        </button>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={disabled}
          title={playing ? "Pause music" : "Play music"}
          aria-label={playing ? "Pause music" : "Play music"}
          className={`${wrap} ${size}`}
        >
          {playing ? <PauseIcon className={icon} /> : <PlayIcon className={icon} />}
        </button>
        <button
          type="button"
          onClick={playNext}
          disabled={disabled}
          title="Next song"
          aria-label="Next song"
          className={`${wrap} ${size}`}
        >
          <NextIcon className={icon} />
        </button>
      </div>
      <VolumeControl compact />
    </div>
  );
}

export default function MusicControl({ className = "h-8 w-8" }) {
  const location = useLocation();
  const { playing, pause } = useMusicPlayer();

  if (playing) {
    return (
      <button
        type="button"
        onClick={pause}
        title="Pause music"
        aria-label="Pause music"
        className={`${wrap} ${className}`}
      >
        <PauseIcon className="h-[55%] w-[55%]" />
      </button>
    );
  }

  const from = location.pathname.startsWith("/music")
    ? undefined
    : { from: location.pathname };

  return (
    <Link
      to="/music"
      state={from}
      title="Music"
      aria-label="Open music"
      className={`${wrap} ${className}`}
    >
      <MusicNoteIcon className="h-[55%] w-[55%]" />
    </Link>
  );
}
