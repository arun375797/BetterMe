import mongoose from "mongoose";

const healthCheckupSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    type: {
      type: String,
      enum: ["appointment", "hba1c", "eye", "foot", "kidney", "other"],
      default: "appointment",
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    result: { type: String, default: "", trim: true, maxlength: 300 },
    questions: { type: String, default: "", trim: true, maxlength: 500 },
    nextDue: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

healthCheckupSchema.index({ date: -1 });
export default mongoose.model("HealthCheckup", healthCheckupSchema);
