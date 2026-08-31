import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const MusicPlayerContext = createContext(null);
const SHUFFLE_KEY = "betterme-music-shuffle";
const VOLUME_KEY = "betterme-music-volume";
const MUTE_KEY = "betterme-music-muted";

function readStoredVolume() {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw == null || raw === "") return 80;
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
  } catch {
    /* ignore */
  }
  return 80;
}

function readStoredMute() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function loadYoutubeApi() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);

  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve(window.YT);
    };
    const src = "https://www.youtube.com/iframe_api";
    if (!document.querySelector(`script[src="${src}"]`)) {
      const tag = document.createElement("script");
      tag.src = src;
      document.head.appendChild(tag);
    }
  });
}

function sameId(a, b) {
  return a && b && String(a) === String(b);
}

function pickNext(queue, currentId, shuffle) {
  if (!queue.length) return null;
  if (queue.length === 1) return queue[0];
  const idx = queue.findIndex((item) => sameId(item._id, currentId));
  if (shuffle) {
    const others = queue.filter((item) => !sameId(item._id, currentId));
    return others[Math.floor(Math.random() * others.length)] || queue[0];
  }
  if (idx < 0) return queue[0];
  return queue[(idx + 1) % queue.length];
}

function pickPrev(queue, currentId) {
  if (!queue.length) return null;
  if (queue.length === 1) return queue[0];
  const idx = queue.findIndex((item) => sameId(item._id, currentId));
  if (idx < 0) return queue[queue.length - 1];
  return queue[(idx - 1 + queue.length) % queue.length];
}

export function MusicPlayerProvider({ children }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const wantIdRef = useRef("");
  const queueRef = useRef([]);
  const shuffleRef = useRef(false);
  const trackRef = useRef(null);
  const playNextRef = useRef(() => {});
  const historyRef = useRef([]);
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(() => {
    try {
      return localStorage.getItem(SHUFFLE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [volume, setVolumeState] = useState(readStoredVolume);
  const [muted, setMuted] = useState(readStoredMute);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);

  trackRef.current = track;
  shuffleRef.current = shuffle;
  volumeRef.current = volume;
  mutedRef.current = muted;

  const applyVolume = useCallback(() => {
    const player = playerRef.current;
    if (!player?.setVolume) return;
    try {
      if (mutedRef.current) {
        player.mute();
        player.setVolume(0);
      } else {
        player.unMute();
        player.setVolume(volumeRef.current);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const readProgress = useCallback(() => {
    const player = playerRef.current;
    if (!player?.getCurrentTime) return;
    try {
      const current = Number(player.getCurrentTime()) || 0;
      const duration = Number(player.getDuration()) || 0;
      setProgress({ current, duration });
    } catch {
      /* ignore */
    }
  }, []);

  const playCurrent = useCallback((id) => {
    const player = playerRef.current;
    if (!player || !readyRef.current || !id) return;
    const currentId = player.getVideoData?.()?.video_id;
    if (currentId === id) {
      player.playVideo();
      return;
    }
    player.loadVideoById(id);
  }, []);

  const ensurePlayer = useCallback(
    async (videoId) => {
      if (playerRef.current) {
        playCurrent(videoId);
        return;
      }
      const YT = await loadYoutubeApi();
      if (!YT || !hostRef.current || !videoId) return;
      if (playerRef.current) {
        playCurrent(videoId);
        return;
      }

      hostRef.current.innerHTML = "";
      const mount = document.createElement("div");
      hostRef.current.appendChild(mount);

      playerRef.current = new YT.Player(mount, {
        videoId,
        width: 200,
        height: 200,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady(event) {
            readyRef.current = true;
            applyVolume();
            const id = wantIdRef.current;
            if (id) {
              const loaded = event.target.getVideoData?.()?.video_id;
              if (loaded === id) event.target.playVideo();
              else event.target.loadVideoById(id);
            }
          },
          onStateChange(event) {
            const state = event.data;
            if (state === YT.PlayerState.PLAYING) {
              setPlaying(true);
              readProgress();
            }
            if (state === YT.PlayerState.PAUSED) setPlaying(false);
            if (state === YT.PlayerState.ENDED) {
              setPlaying(false);
              playNextRef.current();
            }
          },
          onError() {
            setPlaying(false);
          },
        },
      });
    },
    [applyVolume, playCurrent, readProgress]
  );

  useEffect(() => {
    applyVolume();
  }, [applyVolume, volume, muted]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(readProgress, 250);
    return () => window.clearInterval(id);
  }, [playing, readProgress]);

  useEffect(() => {
    return () => {
      readyRef.current = false;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, []);

  const play = useCallback(
    (next, queue) => {
      if (!next?.youtubeId) return;
      if (Array.isArray(queue) && queue.length) {
        queueRef.current = queue;
      } else if (
        !queueRef.current.some((item) => sameId(item._id, next._id))
      ) {
        queueRef.current = [next];
      }
      wantIdRef.current = next.youtubeId;
      setTrack(next);
      setProgress({ current: 0, duration: 0 });
      setPlaying(true);
      ensurePlayer(next.youtubeId);
    },
    [ensurePlayer]
  );

  const pause = useCallback(() => {
    setPlaying(false);
    try {
      playerRef.current?.pauseVideo();
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    (next, queue) => {
      if (
        playing &&
        next &&
        trackRef.current &&
        sameId(trackRef.current._id, next._id)
      ) {
        pause();
        return;
      }
      play(next, queue);
    },
    [pause, play, playing]
  );

  const replayCurrent = useCallback(
    (item) => {
      try {
        playerRef.current?.seekTo(0, true);
        playerRef.current?.playVideo();
        setPlaying(true);
        setProgress((prev) => ({ ...prev, current: 0 }));
      } catch {
        play(item);
      }
    },
    [play]
  );

  const playNext = useCallback(() => {
    const current = trackRef.current;
    const next = pickNext(
      queueRef.current,
      current?._id,
      shuffleRef.current
    );
    if (!next) return;
    if (sameId(next._id, current?._id)) {
      replayCurrent(next);
      return;
    }
    if (current) {
      historyRef.current = [...historyRef.current.slice(-49), current];
    }
    play(next);
  }, [play, replayCurrent]);

  const playPrevious = useCallback(() => {
    const current = trackRef.current;
    const fromHistory = historyRef.current[historyRef.current.length - 1];
    if (fromHistory) {
      historyRef.current = historyRef.current.slice(0, -1);
      play(fromHistory);
      return;
    }
    const prev = pickPrev(queueRef.current, current?._id);
    if (!prev) return;
    if (sameId(prev._id, current?._id)) {
      replayCurrent(prev);
      return;
    }
    play(prev);
  }, [play, replayCurrent]);

  playNextRef.current = playNext;

  const seek = useCallback((seconds) => {
    const player = playerRef.current;
    const n = Number(seconds);
    if (!player?.seekTo || !Number.isFinite(n)) return;
    try {
      player.seekTo(Math.max(0, n), true);
      setProgress((prev) => ({
        ...prev,
        current: Math.max(0, n),
      }));
    } catch {
      /* ignore */
    }
  }, []);

  const setVolume = useCallback((value) => {
    const n = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    setVolumeState(n);
    try {
      localStorage.setItem(VOLUME_KEY, String(n));
    } catch {
      /* ignore */
    }
    if (n > 0) {
      setMuted(false);
      try {
        localStorage.setItem(MUTE_KEY, "0");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((current) => {
      const next = !current;
      try {
        localStorage.setItem(SHUFFLE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      track,
      playing,
      shuffle,
      progress,
      play,
      pause,
      toggle,
      playNext,
      playPrevious,
      seek,
      volume,
      muted,
      setVolume,
      toggleMute,
      toggleShuffle,
    }),
    [
      track,
      playing,
      shuffle,
      progress,
      play,
      pause,
      toggle,
      playNext,
      playPrevious,
      seek,
      volume,
      muted,
      setVolume,
      toggleMute,
      toggleShuffle,
    ]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      <div
        ref={hostRef}
        aria-hidden="true"
        className="pointer-events-none fixed right-0 bottom-0 z-0 h-px w-px overflow-hidden opacity-[0.02]"
      />
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return ctx;
}
