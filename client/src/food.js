export const SLOTS = [
  { id: "morning", label: "Morning", meal: "Breakfast", typical: "8:00 AM" },
  { id: "afternoon", label: "Afternoon", meal: "Lunch", typical: "1:00 PM" },
  { id: "evening", label: "Evening", meal: "Dinner", typical: "7:30 PM" },
  { id: "night", label: "Night", meal: "Snack", typical: "4:30 PM / 9:30 PM" },
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

export function todayKey(now = new Date()) {
  const d = now instanceof Date ? now : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const fieldClass =
  "w-full rounded-xl border border-line bg-[#171c2a] px-4 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-coral/50";
