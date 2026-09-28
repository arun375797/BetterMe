import mongoose from "mongoose";
import { PRIORITIES } from "./Todo.js";

const templateItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TodoCategory",
      default: null,
    },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
  },
  { _id: false }
);

const todoTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    items: {
      type: [templateItemSchema],
      validate: [(items) => items.length > 0 && items.length <= 100, "A template needs 1–100 tasks."],
    },
  },
  { timestamps: true }
);

todoTemplateSchema.index({ createdAt: -1 });

export default mongoose.model("TodoTemplate", todoTemplateSchema);
