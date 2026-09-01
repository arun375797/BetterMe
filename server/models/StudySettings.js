import mongoose from "mongoose";

const rotationSchema = new mongoose.Schema(
  {
    weekday: { type: Number, min: 0, max: 6, required: true },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
  },
  { _id: false }
);

const studySettingsSchema = new mongoose.Schema(
  {
    slotsPerDay: { type: Number, min: 2, max: 3, default: 2 },
    rotation: { type: [rotationSchema], default: [] },
    focus: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("StudySettings", studySettingsSchema);
