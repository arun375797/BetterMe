import mongoose from "mongoose";

const sleepLogSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    bedDate: { type: String, required: true, trim: true },
    bedTime: { type: String, required: true, trim: true },
    wakeDate: { type: String, required: true, trim: true },
    wakeTime: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 960 },
    quality: { type: Number, min: 1, max: 10, default: null },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

sleepLogSchema.index({ day: 1 }, { unique: true });
sleepLogSchema.index({ day: -1 });

export default mongoose.model("SleepLog", sleepLogSchema);
