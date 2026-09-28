import mongoose from "mongoose";

const sleepLogSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    bedDate: { type: String, required: true, trim: true },
    bedTime: { type: String, required: true, trim: true },
    wakeDate: { type: String, required: true, trim: true },
    wakeTime: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 960 },
    actualSleepMinutes: { type: Number, min: 0, max: 960, default: null },
    elapsedMinutes: { type: Number, min: 1, max: 1200, default: null },
    source: {
      type: String,
      enum: ["manual", "health_connect"],
      default: "manual",
      index: true,
    },
    stageMinutes: { type: mongoose.Schema.Types.Mixed, default: {} },
    episodes: {
      type: [{
        externalId: { type: String, required: true },
        bedDate: { type: String, required: true },
        bedTime: { type: String, required: true },
        wakeDate: { type: String, required: true },
        wakeTime: { type: String, required: true },
        durationMinutes: { type: Number, required: true },
        actualSleepMinutes: { type: Number, default: null },
      }],
      default: [],
    },
    quality: { type: Number, min: 1, max: 10, default: null },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

sleepLogSchema.index({ day: 1, source: 1 }, { unique: true });
sleepLogSchema.index({ day: -1 });

export default mongoose.model("SleepLog", sleepLogSchema);
