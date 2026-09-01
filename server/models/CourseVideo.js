import mongoose from "mongoose";

const courseVideoSchema = new mongoose.Schema(
  {
    courseSlug: {
      type: String,
      required: true,
      index: true,
      default: "namaste-dev",
    },
    slNo: { type: Number, default: 1 },
    title: { type: String, required: true, trim: true },
    durationSeconds: { type: Number, default: null },
    section: { type: String, default: "", trim: true },
    sectionOrder: { type: Number, default: 0 },
    done: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseVideoSchema.index({ courseSlug: 1, slNo: 1 });

export default mongoose.model("CourseVideo", courseVideoSchema);
