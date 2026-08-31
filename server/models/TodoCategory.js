import mongoose from "mongoose";

export const CATEGORY_COLORS = [
  "#6ec8ff", // cyan
  "#3ce6d4", // teal
  "#b9a6ff", // violet
  "#e8c36a", // gold
  "#e88b7a", // coral
  "#a8e890", // green
  "#f0a0d0", // pink
  "#ffb347", // orange
];

const todoCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    color: { type: String, default: "#6ec8ff" },
    emoji: { type: String, default: "", maxlength: 10 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

todoCategorySchema.index({ order: 1, createdAt: 1 });

export default mongoose.model("TodoCategory", todoCategorySchema);
