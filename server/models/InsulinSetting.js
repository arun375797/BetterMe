import mongoose from "mongoose";

const insulinSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    dailyReference: { type: Number, min: 0, max: 200, default: 35 },
  },
  { timestamps: true }
);

export default mongoose.model("InsulinSetting", insulinSettingSchema);
