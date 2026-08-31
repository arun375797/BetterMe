import mongoose from "mongoose";

const sugarReadingSchema = new mongoose.Schema(
  {
    recordedAt: { type: Date, required: true },
    level: { type: Number, required: true, min: 20, max: 800 },
    mealTiming: {
      type: String,
      enum: ["before", "after"],
      required: true,
    },
    demo: { type: Boolean, default: false },
    insulinDose: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

sugarReadingSchema.index({ recordedAt: -1 });

export default mongoose.model("SugarReading", sugarReadingSchema);
