import mongoose from "mongoose";

const TIMINGS = ["morning", "afternoon", "evening", "night"];
const FOOD = ["before", "after", "with", "anytime"];
const KINDS = ["vitamin", "tablet"];

const vitaminItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: KINDS, required: true },
    dose: { type: String, default: "", trim: true },
    timings: {
      type: [String],
      default: ["morning"],
      validate: {
        validator: (list) =>
          Array.isArray(list) &&
          list.length > 0 &&
          list.every((item) => TIMINGS.includes(item)),
        message: "Pick at least one time of day.",
      },
    },
    foodTiming: {
      type: String,
      enum: FOOD,
      default: "anytime",
    },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

vitaminItemSchema.index({ kind: 1, name: 1 });

export { TIMINGS, FOOD, KINDS };
export default mongoose.model("VitaminItem", vitaminItemSchema);
