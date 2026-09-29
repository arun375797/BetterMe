import { Router } from "express";
import InsulinEntry from "../models/InsulinEntry.js";
import InsulinSetting from "../models/InsulinSetting.js";
import SugarReading from "../models/SugarReading.js";
import { parseWallClock } from "../lib/wallClock.js";

const router = Router();

function parseEntry(body) {
  const dose = Number(body?.dose);
  if (!body?.date || !body?.time || !Number.isFinite(dose)) {
    return { error: "Date, time, and insulin dose are required." };
  }
  if (dose < 0.5 || dose > 200) {
    return { error: "Insulin dose must be between 0.5 and 200 units." };
  }
  const recordedAt = parseWallClock(body);
  if (!recordedAt) return { error: "Date or time is invalid." };
  const kinds = ["rapid", "long", "mixed", "other"];
  return {
    data: {
      recordedAt,
      dose,
      kind: kinds.includes(body.kind) ? body.kind : "other",
      notes: String(body.notes || "").trim(),
    },
  };
}

router.get("/", async (_req, res) => {
  const [direct, sugar, setting] = await Promise.all([
    InsulinEntry.find().sort({ recordedAt: -1 }).lean(),
    SugarReading.find({ insulinDose: { $gt: 0 }, demo: { $ne: true } }).sort({ recordedAt: -1 }).lean(),
    InsulinSetting.findOne({ key: "default" }).lean(),
  ]);
  const entries = [
    ...direct.map((item) => ({ ...item, dose: item.dose, source: "direct" })),
    ...sugar.map((item) => ({
      _id: `sugar-${item._id}`,
      sourceId: item._id,
      source: "sugar",
      recordedAt: item.recordedAt,
      dose: item.insulinDose,
      kind: "other",
      notes: `${item.mealTiming === "before" ? "Before" : "After"} food · sugar ${item.level} mg/dL`,
      sugarLevel: item.level,
      mealTiming: item.mealTiming,
    })),
  ].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  res.json({
    entries,
    settings: { dailyReference: setting?.dailyReference ?? 35 },
  });
});

router.patch("/settings", async (req, res) => {
  const dailyReference = Number(req.body?.dailyReference);
  if (!Number.isFinite(dailyReference) || dailyReference < 0 || dailyReference > 200) {
    return res.status(400).json({ message: "Reference dose must be between 0 and 200 units." });
  }
  const setting = await InsulinSetting.findOneAndUpdate(
    { key: "default" },
    { dailyReference },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ dailyReference: setting.dailyReference });
});

router.post("/", async (req, res) => {
  const parsed = parseEntry(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const entry = await InsulinEntry.create(parsed.data);
  res.status(201).json({ ...entry.toObject(), source: "direct" });
});

router.patch("/:id", async (req, res) => {
  const parsed = parseEntry(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const entry = await InsulinEntry.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true,
    runValidators: true,
  });
  if (!entry) return res.status(404).json({ message: "Insulin entry not found." });
  res.json({ ...entry.toObject(), source: "direct" });
});

router.delete("/:id", async (req, res) => {
  const entry = await InsulinEntry.findByIdAndDelete(req.params.id);
  if (!entry) return res.status(404).json({ message: "Insulin entry not found." });
  res.json({ ok: true });
});

export default router;
