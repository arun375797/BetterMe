import mongoose from "mongoose";

export const KINDS = ["yoga", "badminton", "weight"];

const exerciseSessionSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: KINDS, required: true },
    what: { type: String, required: true, trim: true },
    why: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 600 },
    felt: { type: Number, min: 1, max: 10, default: null },
    recordedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

exerciseSessionSchema.index({ kind: 1, recordedAt: -1 });
exerciseSessionSchema.index({ recordedAt: -1 });

export default mongoose.model("ExerciseSession", exerciseSessionSchema);
