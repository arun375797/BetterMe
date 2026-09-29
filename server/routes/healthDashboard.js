import { Router } from "express";
import HealthProfile from "../models/HealthProfile.js";
import SymptomLog from "../models/SymptomLog.js";
import HealthCheckup from "../models/HealthCheckup.js";
import CareTaskLog from "../models/CareTaskLog.js";
import { parseWallClock } from "../lib/wallClock.js";

const router = Router();
const DEFAULT_TARGETS = { beforeMin: 70, beforeMax: 140, afterMin: 70, afterMax: 180 };

function profilePayload(body = {}) {
  const targets = body.glucoseTargets || {};
  const glucoseTargets = Object.fromEntries(
    Object.keys(DEFAULT_TARGETS).map((key) => {
      const value = Number(targets[key]);
      return [key, Number.isFinite(value) ? value : DEFAULT_TARGETS[key]];
    })
  );
  if (glucoseTargets.beforeMin >= glucoseTargets.beforeMax || glucoseTargets.afterMin >= glucoseTargets.afterMax) {
    return { error: "Each glucose minimum must be lower than its maximum." };
  }
  return {
    data: {
      conditions: Array.isArray(body.conditions) ? body.conditions.map((item) => String(item).trim()).filter(Boolean) : [],
      medications: Array.isArray(body.medications) ? body.medications.map((item) => ({
        name: String(item.name || "").trim(), dose: String(item.dose || "").trim(),
        timing: String(item.timing || "").trim(), instructions: String(item.instructions || "").trim(),
      })).filter((item) => item.name) : [],
      glucoseTargets,
      exerciseLimits: String(body.exerciseLimits || "").trim(),
      lowGlucoseInstructions: String(body.lowGlucoseInstructions || "").trim(),
      sickDayInstructions: String(body.sickDayInstructions || "").trim(),
      clinicianNotes: String(body.clinicianNotes || "").trim(),
    },
  };
}

router.get("/profile", async (_req, res) => {
  const profile = await HealthProfile.findOne({ key: "default" }).lean();
  res.json(profile || { key: "default", conditions: [], medications: [], glucoseTargets: DEFAULT_TARGETS, exerciseLimits: "", lowGlucoseInstructions: "", sickDayInstructions: "", clinicianNotes: "" });
});

router.patch("/profile", async (req, res) => {
  const parsed = profilePayload(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const profile = await HealthProfile.findOneAndUpdate({ key: "default" }, parsed.data, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json(profile);
});

router.get("/today", async (req, res) => {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.day || "")) ? req.query.day : new Date().toISOString().slice(0, 10);
  res.json({ day, logs: await CareTaskLog.find({ day }).lean() });
});

router.patch("/today/:taskId", async (req, res) => {
  const day = String(req.body?.day || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return res.status(400).json({ message: "Day is invalid." });
  const log = await CareTaskLog.findOneAndUpdate({ day, taskId: req.params.taskId }, { done: Boolean(req.body?.done) }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json(log);
});

router.get("/symptoms", async (_req, res) => res.json({ logs: await SymptomLog.find().sort({ recordedAt: -1 }).lean() }));
router.post("/symptoms", async (req, res) => {
  const recordedAt = parseWallClock(req.body || {});
  const symptom = String(req.body?.symptom || "").trim();
  const severity = Number(req.body?.severity);
  if (!recordedAt || !symptom || !Number.isFinite(severity) || severity < 0 || severity > 10) return res.status(400).json({ message: "Date, time, symptom, and severity from 0 to 10 are required." });
  const log = await SymptomLog.create({ recordedAt, symptom, severity, location: req.body?.location, trigger: req.body?.trigger, activityImpact: req.body?.activityImpact, notes: req.body?.notes });
  res.status(201).json(log);
});
router.delete("/symptoms/:id", async (req, res) => { const item = await SymptomLog.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message: "Symptom log not found." }); res.json({ ok: true }); });

router.get("/checkups", async (_req, res) => res.json({ items: await HealthCheckup.find().sort({ date: -1 }).lean() }));
router.post("/checkups", async (req, res) => {
  const date = String(req.body?.date || "");
  const title = String(req.body?.title || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) return res.status(400).json({ message: "Date and title are required." });
  const item = await HealthCheckup.create({ date, title, type: req.body?.type, result: req.body?.result, questions: req.body?.questions, nextDue: req.body?.nextDue || "" });
  res.status(201).json(item);
});
router.delete("/checkups/:id", async (req, res) => { const item = await HealthCheckup.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message: "Checkup not found." }); res.json({ ok: true }); });

export default router;
