import mongoose from "mongoose";

const musicTrackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true },
    youtubeUrl: { type: String, default: "", trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MusicCategory",
      default: null,
    },
    favorite: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

musicTrackSchema.index({ youtubeId: 1 }, { unique: true });
musicTrackSchema.index({ categoryId: 1, order: 1, createdAt: 1 });
musicTrackSchema.index({ favorite: 1 });

export default mongoose.model("MusicTrack", musicTrackSchema);
