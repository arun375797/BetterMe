import mongoose from "mongoose";

const schema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  day: { type: String, required: true, index: true },
  kind: { type: String, enum: ["focus", "break"], required: true },
  task: { type: String, maxlength: 200, default: "" },
  note: { type: String, maxlength: 1000, default: "" },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  plannedMs: { type: Number, required: true },
  elapsedMs: { type: Number, required: true },
  pausedMs: { type: Number, required: true },
  distractedMs: { type: Number, required: true },
  completed: { type: Boolean, required: true },
}, { timestamps: true });

export default mongoose.model("PomodoroSession", schema);
