import { Router } from "express";
import SugarReading from "../models/SugarReading.js";
import { parseWallClock } from "../lib/wallClock.js";

const router = Router();

function startOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function classify(level, mealTiming) {
  if (mealTiming === "before") {
    if (level < 70) return "low";
    if (level <= 99) return "in range";
    if (level <= 125) return "elevated";
    return "high";
  }
  if (level < 70) return "low";
  if (level <= 139) return "in range";
  if (level <= 179) return "elevated";
  return "high";
}

function avg(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function statsFrom(readings) {
  const levels = readings.map((r) => r.level);
  const latest = readings[0] || null;
  const last7 = readings.filter((r) => r.recordedAt >= daysAgo(6));
  const today = readings.filter(
    (r) => r.recordedAt >= startOfLocalDay(new Date())
  );

  return {
    count: readings.length,
    latest,
    todayCount: today.length,
    todayAverage: avg(today.map((r) => r.level)),
    weekAverage: avg(last7.map((r) => r.level)),
    allAverage: avg(levels),
    min: levels.length ? Math.min(...levels) : null,
    max: levels.length ? Math.max(...levels) : null,
    beforeAverage: avg(
      readings.filter((r) => r.mealTiming === "before").map((r) => r.level)
    ),
    afterAverage: avg(
      readings.filter((r) => r.mealTiming === "after").map((r) => r.level)
    ),
  };
}

function parseReading(body) {
  const { date, time, level, mealTiming, insulinDose } = body || {};
  const numeric = Number(level);
  if (!date || !time || !Number.isFinite(numeric)) {
    return { error: "Date, time, and sugar level are required." };
  }
  if (mealTiming !== "before" && mealTiming !== "after") {
    return { error: "Choose before food or after food." };
  }
  if (numeric < 20 || numeric > 800) {
    return { error: "Sugar level looks out of range." };
  }

  const insulinRaw =
    insulinDose === "" || insulinDose == null ? 0 : Number(insulinDose);
  if (!Number.isFinite(insulinRaw) || insulinRaw < 0 || insulinRaw > 100) {
    return { error: "Insulin dose looks out of range." };
  }

  const recordedAt = parseWallClock(body);
  if (!recordedAt) {
    return { error: "Date or time is invalid." };
  }

  return {
    data: {
      recordedAt,
      level: numeric,
      mealTiming,
      insulinDose: insulinRaw,
    },
  };
}

router.get("/", async (_req, res) => {
  const readings = await SugarReading.find().sort({ recordedAt: -1 }).lean();
  const withStatus = readings.map((item) => ({
    ...item,
    status: classify(item.level, item.mealTiming),
  }));
  res.json({
    readings: withStatus,
    stats: statsFrom(withStatus),
  });
});

router.post("/", async (req, res) => {
  const parsed = parseReading(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const reading = await SugarReading.create(parsed.data);
  const obj = reading.toObject();
  res.status(201).json({ ...obj, status: classify(obj.level, obj.mealTiming) });
});

router.patch("/:id", async (req, res) => {
  const parsed = parseReading(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const reading = await SugarReading.findByIdAndUpdate(
    req.params.id,
    parsed.data,
    { new: true, runValidators: true }
  );
  if (!reading) {
    return res.status(404).json({ message: "Reading not found." });
  }
  const obj = reading.toObject();
  res.json({ ...obj, status: classify(obj.level, obj.mealTiming) });
});

router.delete("/:id", async (req, res) => {
  const deleted = await SugarReading.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Reading not found." });
  }
  res.json({ ok: true });
});

export default router;
