import { Router } from "express";
import SleepLog from "../models/SleepLog.js";
import { statsFromLogs } from "../lib/sleepStats.js";

const router = Router();

function dayKey(value) {
  const raw = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function timeKey(value) {
  const raw = String(value || "").trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : null;
}

function parseWhen(date, time) {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeDuration(bedDate, bedTime, wakeDate, wakeTime) {
  const bed = parseWhen(bedDate, bedTime);
  let wake = parseWhen(wakeDate, wakeTime);
  if (!bed || !wake) return null;
  if (wake <= bed) {
    wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
  }
  const minutes = Math.round((wake - bed) / 60000);
  if (minutes < 1 || minutes > 960) return null;
  return minutes;
}

function cleanPayload(body) {
  const wakeDate = dayKey(body?.wakeDate || body?.day);
  const bedDate = dayKey(body?.bedDate);
  const bedTime = timeKey(body?.bedTime);
  const wakeTime = timeKey(body?.wakeTime);
  const qualityRaw = body?.quality;
  const quality =
    qualityRaw === "" || qualityRaw == null ? null : Number(qualityRaw);
  const notes = String(body?.notes || "").trim();

  if (!wakeDate) return { error: "Pick the wake-up date." };
  if (!bedDate) return { error: "Pick the date you went to bed." };
  if (!bedTime) return { error: "Pick your bedtime." };
  if (!wakeTime) return { error: "Pick your wake-up time." };

  const durationMinutes = computeDuration(bedDate, bedTime, wakeDate, wakeTime);
  if (!durationMinutes) {
    return { error: "Sleep duration must be between 1 minute and 16 hours." };
  }
  if (quality != null && (!Number.isFinite(quality) || quality < 1 || quality > 10)) {
    return { error: "Quality rating must be 1 to 10." };
  }

  return {
    data: {
      day: wakeDate,
      bedDate,
      bedTime,
      wakeDate,
      wakeTime,
      durationMinutes,
      actualSleepMinutes: null,
      elapsedMinutes: durationMinutes,
      source: "manual",
      stageMinutes: {},
      episodes: [],
      quality,
      notes,
    },
  };
}

router.get("/", async (req, res) => {
  const requested = String(req.query.source || "preferred");
  const fit3Count = await SleepLog.countDocuments({ source: "health_connect" });
  const source = requested === "preferred"
    ? (fit3Count ? "health_connect" : "manual")
    : requested;
  const filter = source === "all"
    ? {}
    : source === "health_connect"
      ? { source: "health_connect" }
      : { $or: [{ source: "manual" }, { source: { $exists: false } }] };
  const logs = await SleepLog.find(filter).sort({ day: -1, bedTime: 1 }).lean();
  const stats = statsFromLogs(logs);
  res.json({ logs: stats.logs, stats, source, counts: { fit3: fit3Count, manual: await SleepLog.countDocuments({ $or: [{ source: "manual" }, { source: { $exists: false } }] }) } });
});

router.post("/", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const log = await SleepLog.findOneAndUpdate(
    { day: cleaned.data.day, source: "manual" },
    cleaned.data,
    { new: true, upsert: true, runValidators: true }
  );
  const stats = statsFromLogs(
    await SleepLog.find().sort({ day: -1 }).lean()
  );
  const entry = stats.logs.find((item) => item._id.toString() === log._id.toString());
  res.status(201).json({ log: entry || log, stats });
});

router.patch("/:id", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const existing = await SleepLog.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Sleep log not found." });
  }
  if (existing.source === "health_connect") {
    return res.status(400).json({ message: "Fit3 sleep is read-only. Resync it from the Android app." });
  }
  if (cleaned.data.day !== existing.day) {
    const clash = await SleepLog.findOne({ day: cleaned.data.day, source: "manual" });
    if (clash && clash._id.toString() !== existing._id.toString()) {
      return res
        .status(400)
        .json({ message: "Another entry already exists for that wake date." });
    }
  }
  const log = await SleepLog.findByIdAndUpdate(req.params.id, cleaned.data, {
    new: true,
    runValidators: true,
  });
  const stats = statsFromLogs(
    await SleepLog.find().sort({ day: -1 }).lean()
  );
  const entry = stats.logs.find((item) => item._id.toString() === log._id.toString());
  res.json({ log: entry || log, stats });
});

router.delete("/:id", async (req, res) => {
  const deleted = await SleepLog.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Sleep log not found." });
  }
  res.json({ ok: true });
});

export default router;
