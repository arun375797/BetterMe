import mongoose from "mongoose";
import { GI, SLOTS } from "./FoodItem.js";

export const STATUSES = ["eaten", "skipped"];

const mealLogSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    slot: { type: String, enum: SLOTS, required: true },
    status: { type: String, enum: STATUSES, required: true },
    foodName: { type: String, default: "", trim: true },
    carbsG: { type: Number, default: 0, min: 0, max: 400 },
    fiberG: { type: Number, default: 0, min: 0, max: 80 },
    proteinG: { type: Number, default: 0, min: 0, max: 200 },
    fatG: { type: Number, default: 0, min: 0, max: 200 },
    glycemicIndex: { type: String, enum: GI, default: "medium" },
    sugarNote: { type: String, default: "", trim: true },
    demo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mealLogSchema.index({ day: 1, slot: 1 }, { unique: true });
mealLogSchema.index({ day: -1 });

export default mongoose.model("MealLog", mealLogSchema);
