import mongoose from "mongoose";

export const SECTIONS = [
  "books",
  "technology",
  "language",
  "english",
  "presentation",
  "certifications",
];

export const BOOK_STATUSES = ["want", "read"];

const personalityItemSchema = new mongoose.Schema(
  {
    section: { type: String, enum: SECTIONS, required: true, index: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    status: { type: String, enum: BOOK_STATUSES, default: "want" },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

personalityItemSchema.index({ section: 1, updatedAt: -1 });

export default mongoose.model("PersonalityItem", personalityItemSchema);
