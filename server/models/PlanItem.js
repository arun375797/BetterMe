import mongoose from "mongoose";

export const PLAN_PRIORITIES = ["low", "medium", "high"];

const planItemSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlanItem",
      default: null,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: PLAN_PRIORITIES,
      default: "medium",
    },
    learned: { type: Boolean, default: false },
    learnedAt: { type: Date, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

planItemSchema.index({ subject: 1, parent: 1, date: 1, order: 1 });
planItemSchema.index({ date: 1, learned: 1 });

export default mongoose.model("PlanItem", planItemSchema);
