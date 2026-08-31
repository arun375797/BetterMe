import mongoose from "mongoose";

const bookPageSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    heading: { type: String, default: "Page 1", trim: true },
    html: { type: String, default: "" },
    order: { type: Number, default: 0 },
    notebook: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

bookPageSchema.index({ book: 1, order: 1 });

export default mongoose.model("BookPage", bookPageSchema);
