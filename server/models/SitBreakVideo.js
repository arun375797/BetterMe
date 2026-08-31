import mongoose from "mongoose";

const sitBreakVideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true },
    youtubeUrl: { type: String, default: "", trim: true },
    durationSeconds: { type: Number, default: null, min: 1, max: 7200 },
    seeded: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sitBreakVideoSchema.index({ youtubeId: 1 }, { unique: true });
sitBreakVideoSchema.index({ order: 1, createdAt: 1 });

export default mongoose.model("SitBreakVideo", sitBreakVideoSchema);
