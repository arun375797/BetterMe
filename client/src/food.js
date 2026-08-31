export const SLOTS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

export const GI = [
  { id: "low", label: "Low GI" },
  { id: "medium", label: "Medium GI" },
  { id: "high", label: "High GI" },
];

export const giClass = {
  low: "text-teal",
  medium: "text-gold",
  high: "text-coral",
};

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-coral/50";
