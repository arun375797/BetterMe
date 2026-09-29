import mongoose from "mongoose";

const careTaskLogSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    taskId: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

careTaskLogSchema.index({ day: 1, taskId: 1 }, { unique: true });
export default mongoose.model("CareTaskLog", careTaskLogSchema);
