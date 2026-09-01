import mongoose from "mongoose";

const studyLogSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    kind: {
      type: String,
      enum: ["theory", "practical", "review"],
      required: true,
    },
    status: {
      type: String,
      enum: ["done", "skipped"],
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
    },
  },
  { timestamps: true }
);

studyLogSchema.index({ day: 1, kind: 1, subject: 1 }, { unique: true });
studyLogSchema.index({ subject: 1, kind: 1, status: 1 });

export default mongoose.model("StudyLog", studyLogSchema);
