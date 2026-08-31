import mongoose from "mongoose";

const ACCENTS = ["gold", "teal", "coral", "cyan", "violet"];

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    accent: { type: String, enum: ACCENTS, default: "gold" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bookSchema.index({ order: 1, createdAt: 1 });

export { ACCENTS };
export default mongoose.model("Book", bookSchema);
