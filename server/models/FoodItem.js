import mongoose from "mongoose";

export const SLOTS = ["morning", "afternoon", "evening", "night"];
export const GI = ["low", "medium", "high"];

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    style: { type: String, required: true, trim: true },
    slots: {
      type: [String],
      enum: SLOTS,
      required: true,
    },
    instructions: { type: String, default: "", trim: true },
    carbsG: { type: Number, default: 0, min: 0, max: 400 },
    fiberG: { type: Number, default: 0, min: 0, max: 80 },
    proteinG: { type: Number, default: 0, min: 0, max: 200 },
    fatG: { type: Number, default: 0, min: 0, max: 200 },
    glycemicIndex: { type: String, enum: GI, default: "medium" },
    sugarNote: { type: String, default: "", trim: true },
    youtubeUrl: { type: String, default: "", trim: true },
    favorite: { type: Boolean, default: false },
    demo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("FoodItem", foodItemSchema);
