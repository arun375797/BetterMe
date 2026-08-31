export const DIFFICULTIES = [
  { id: "easy", label: "Easy", className: "text-teal bg-teal/12 border-teal/30" },
  { id: "medium", label: "Medium", className: "text-gold bg-gold/12 border-gold/30" },
  { id: "hard", label: "Hard", className: "text-coral bg-coral/12 border-coral/30" },
  { id: "ec", label: "EC", className: "text-cyan bg-cyan/12 border-cyan/30" },
];

export function difficultyMeta(id) {
  return DIFFICULTIES.find((item) => item.id === id) || DIFFICULTIES[1];
}
