import mongoose from "mongoose";

export const PRIORITIES = ["low", "medium", "high"];

const todoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TodoCategory",
      default: null,
    },
    done: { type: Boolean, default: false },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

todoSchema.index({ categoryId: 1, createdAt: -1 });
todoSchema.index({ createdAt: -1 });
todoSchema.index({ done: 1, createdAt: -1 });

export default mongoose.model("Todo", todoSchema);
