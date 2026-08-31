import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
    },
    title: { type: String, required: true },
    level: {
      type: String,
      enum: ["low", "medium", "hard"],
      default: "medium",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "ec"],
      default: "medium",
    },
    inReview: { type: Boolean, default: false },
    fromNote: { type: Boolean, default: false },
    section: {
      type: String,
      enum: ["theory", "practical"],
      default: "theory",
    },
    highlighted: { type: Boolean, default: false },
    slNo: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
    notebook: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ fontSize: 18, blocks: [] }),
    },
    youtubeUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

topicSchema.index({ subject: 1, section: 1, parent: 1, slNo: 1 });
topicSchema.index({ parent: 1, fromNote: 1 });
topicSchema.index({ inReview: 1, parent: 1, updatedAt: -1 });

export default mongoose.model("Topic", topicSchema);
