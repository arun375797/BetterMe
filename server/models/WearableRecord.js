import mongoose from "mongoose";

export const WEARABLE_TYPES = [
  "sleep", "steps", "heart_rate", "resting_heart_rate", "oxygen",
  "distance", "floors", "active_calories", "total_calories", "exercise",
];

const wearableRecordSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: WEARABLE_TYPES, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    sourceApp: { type: String, required: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    syncedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

wearableRecordSchema.index({ type: 1, startTime: -1 });
wearableRecordSchema.index({ startTime: -1 });

export default mongoose.model("WearableRecord", wearableRecordSchema);
