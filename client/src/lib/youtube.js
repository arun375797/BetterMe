const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function parseYoutubeId(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (ID_RE.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return ID_RE.test(id) ? id : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v && ID_RE.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const kind = parts[0];
      if (
        (kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") &&
        ID_RE.test(parts[1] || "")
      ) {
        return parts[1];
      }
    }
  } catch {
    return "";
  }
  return "";
}

export function youtubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeThumbHd(id) {
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
}

export function youtubeEmbedUrl(id) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    autoplay: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function formatWatchTime(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return "";
  const minutes = Math.max(1, Math.round(n / 60));
  return `${minutes} min`;
}

export function minutesToSeconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 60);
}

export function secondsToMinutesInput(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.max(1, Math.round(n / 60)));
}
