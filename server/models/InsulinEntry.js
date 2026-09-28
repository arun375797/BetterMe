import mongoose from "mongoose";

const insulinEntrySchema = new mongoose.Schema(
  {
    recordedAt: { type: Date, required: true },
    dose: { type: Number, required: true, min: 0.5, max: 200 },
    kind: {
      type: String,
      enum: ["rapid", "long", "mixed", "other"],
      default: "other",
    },
    notes: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true }
);

insulinEntrySchema.index({ recordedAt: -1 });

export default mongoose.model("InsulinEntry", insulinEntrySchema);
