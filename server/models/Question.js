import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    title: { type: String, required: true },
    prompt: { type: String, default: "" },
    // Which sample collection the question runs against, e.g. "employees"
    // or "users + orders" for a join.
    collectionName: { type: String, default: "", trim: true },
    // How to think about the problem, written without code. Kept apart from
    // solutions[].logic so a seeded hint never mixes with your own answer.
    approach: { type: String, default: "" },
    notes: { type: String, default: "" },
    code: { type: String, default: "" },
    language: { type: String, default: "javascript" },
    solutions: [
      {
        id: { type: String, required: true },
        language: { type: String, default: "javascript" },
        code: { type: String, default: "" },
        logic: { type: String, default: "" },
      },
    ],
    relatedSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "ec"],
      default: "medium",
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ topic: 1, order: 1 });

export default mongoose.model("Question", questionSchema);
