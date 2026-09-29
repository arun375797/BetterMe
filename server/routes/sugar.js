import { Router } from "express";
import SugarReading from "../models/SugarReading.js";
import HealthProfile from "../models/HealthProfile.js";
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

const DEFAULT_TARGETS = { beforeMin: 70, beforeMax: 140, afterMin: 70, afterMax: 180 };

function classify(level, mealTiming, targets = DEFAULT_TARGETS) {
  const prefix = mealTiming === "before" ? "before" : "after";
  const min = Number(targets[`${prefix}Min`] ?? DEFAULT_TARGETS[`${prefix}Min`]);
  const max = Number(targets[`${prefix}Max`] ?? DEFAULT_TARGETS[`${prefix}Max`]);
  if (level < min) return "below target";
  if (level <= max) return "in target";
  return "above target";
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

router.get("/", async (req, res) => {
  const scope = String(req.query.scope || "real");
  const filter = scope === "demo" ? { demo: true } : scope === "all" ? {} : { demo: { $ne: true } };
  const [readings, profile] = await Promise.all([
    SugarReading.find(filter).sort({ recordedAt: -1 }).lean(),
    HealthProfile.findOne({ key: "default" }).lean(),
  ]);
  const targets = profile?.glucoseTargets || DEFAULT_TARGETS;
  const withStatus = readings.map((item) => ({
    ...item,
    status: classify(item.level, item.mealTiming, targets),
  }));
  res.json({
    readings: withStatus,
    stats: statsFrom(withStatus),
    targets,
    scope,
  });
});

router.post("/", async (req, res) => {
  const parsed = parseReading(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const [reading, profile] = await Promise.all([SugarReading.create(parsed.data), HealthProfile.findOne({ key: "default" }).lean()]);
  const obj = reading.toObject();
  res.status(201).json({ ...obj, status: classify(obj.level, obj.mealTiming, profile?.glucoseTargets) });
});

router.patch("/:id", async (req, res) => {
  const parsed = parseReading(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const [reading, profile] = await Promise.all([
    SugarReading.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true }),
    HealthProfile.findOne({ key: "default" }).lean(),
  ]);
  if (!reading) {
    return res.status(404).json({ message: "Reading not found." });
  }
  const obj = reading.toObject();
  res.json({ ...obj, status: classify(obj.level, obj.mealTiming, profile?.glucoseTargets) });
});

router.delete("/:id", async (req, res) => {
  const deleted = await SugarReading.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Reading not found." });
  }
  res.json({ ok: true });
});

export default router;
