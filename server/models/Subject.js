import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortName: { type: String, required: true },
    description: { type: String, default: "" },
    accent: { type: String, default: "teal" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
