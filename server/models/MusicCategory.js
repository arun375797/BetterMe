import mongoose from "mongoose";

const musicCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#3ce6d4", trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

musicCategorySchema.index({ order: 1, createdAt: 1 });

export default mongoose.model("MusicCategory", musicCategorySchema);
