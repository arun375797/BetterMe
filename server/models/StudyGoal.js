import mongoose from "mongoose";

export const GOAL_SECTIONS = ["theory", "practical"];

const studyGoalSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    section: {
      type: String,
      enum: GOAL_SECTIONS,
      required: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 240 },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studyGoalSchema.index({ subject: 1, section: 1, done: 1, order: 1 });

export default mongoose.model("StudyGoal", studyGoalSchema);
