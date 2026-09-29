import mongoose from "mongoose";

const symptomLogSchema = new mongoose.Schema(
  {
    recordedAt: { type: Date, required: true },
    symptom: { type: String, required: true, trim: true, maxlength: 100 },
    location: { type: String, default: "", trim: true, maxlength: 100 },
    severity: { type: Number, required: true, min: 0, max: 10 },
    trigger: { type: String, default: "", trim: true, maxlength: 200 },
    activityImpact: { type: String, default: "", trim: true, maxlength: 300 },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

symptomLogSchema.index({ recordedAt: -1 });
export default mongoose.model("SymptomLog", symptomLogSchema);
