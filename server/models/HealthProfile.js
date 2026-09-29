import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dose: { type: String, default: "", trim: true },
    timing: { type: String, default: "", trim: true },
    instructions: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const healthProfileSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    conditions: { type: [String], default: [] },
    medications: { type: [medicationSchema], default: [] },
    glucoseTargets: {
      beforeMin: { type: Number, min: 20, max: 800, default: 70 },
      beforeMax: { type: Number, min: 20, max: 800, default: 140 },
      afterMin: { type: Number, min: 20, max: 800, default: 70 },
      afterMax: { type: Number, min: 20, max: 800, default: 180 },
    },
    exerciseLimits: { type: String, default: "", trim: true },
    lowGlucoseInstructions: { type: String, default: "", trim: true },
    sickDayInstructions: { type: String, default: "", trim: true },
    clinicianNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("HealthProfile", healthProfileSchema);
