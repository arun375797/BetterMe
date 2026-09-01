export function parseDuration(value) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  const text = String(value).trim().toLowerCase();
  if (!text || text.includes("not listed")) return null;

  const labeled = text.match(
    /^(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?\s*(?:(\d+)\s*s(?:ec(?:onds?)?)?)?$/
  );
  if (labeled && (labeled[1] || labeled[2] || labeled[3])) {
    return (
      Number(labeled[1] || 0) * 3600 +
      Number(labeled[2] || 0) * 60 +
      Number(labeled[3] || 0)
    );
  }

  if (/^\d+$/.test(text)) return Number(text) * 60;

  const parts = text.split(":").map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return 0;
  }
  if (parts.length === 3) {
    return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  }
  if (parts.length === 2) {
    return Math.round(parts[0] * 60 + parts[1]);
  }
  return Math.round(parts[0]);
}

export function formatDuration(totalSeconds) {
  if (totalSeconds == null || totalSeconds === "") return "—";
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
