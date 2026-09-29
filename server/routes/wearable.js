import { Router } from "express";
import WearableRecord, { WEARABLE_TYPES } from "../models/WearableRecord.js";
import SleepLog from "../models/SleepLog.js";

const router = Router();
const DAY_MS = 24 * 60 * 60 * 1000;

function cleanRecord(item) {
  const externalId = String(item?.externalId || "").trim().slice(0, 300);
  const type = String(item?.type || "");
  const startTime = new Date(item?.startTime);
  const endTime = new Date(item?.endTime || item?.startTime);
  const sourceApp = String(item?.sourceApp || "Health Connect").trim().slice(0, 160);
  if (!externalId || !WEARABLE_TYPES.includes(type)) return null;
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || endTime < startTime) return null;
  if (JSON.stringify(item?.data || {}).length > 100_000) return null;
  return { externalId, type, startTime, endTime, sourceApp, data: item.data || {}, syncedAt: new Date() };
}

function localParts(date, offsetSeconds = null) {
  const shifted = offsetSeconds == null ? date : new Date(date.getTime() + Number(offsetSeconds) * 1000);
  const iso = shifted.toISOString();
  return { day: iso.slice(0, 10), time: iso.slice(11, 16) };
}

function sleepDay(record) {
  return localParts(record.endTime, record.data?.endOffsetSeconds).day;
}

async function rebuildSleepDays(days) {
  if (!days.size) return;
  const candidates = await WearableRecord.find({ type: "sleep" }).sort({ startTime: 1 }).lean();
  const grouped = new Map([...days].map((day) => [day, []]));
  for (const record of candidates) {
    const day = sleepDay(record);
    if (grouped.has(day)) grouped.get(day).push(record);
  }
  for (const [day, records] of grouped) {
    if (!records.length) {
      await SleepLog.deleteOne({ day, source: "health_connect" });
      continue;
    }
    const episodes = records.map((record) => {
      const start = localParts(record.startTime, record.data?.startOffsetSeconds);
      const end = localParts(record.endTime, record.data?.endOffsetSeconds);
      return {
        externalId: record.externalId,
        bedDate: start.day,
        bedTime: start.time,
        wakeDate: end.day,
        wakeTime: end.time,
        durationMinutes: Math.max(1, Math.round(Number(record.data?.sleepTimeMinutes) || (record.endTime - record.startTime) / 60000)),
        actualSleepMinutes: Math.max(0, Math.round(Number(record.data?.actualSleepMinutes) || 0)) || null,
        elapsedMinutes: Math.max(1, Math.round((record.endTime - record.startTime) / 60000)),
        stageMinutes: record.data?.stages || {},
      };
    });
    const main = episodes.slice().sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
    const durationMinutes = Math.min(960, episodes.reduce((sum, item) => sum + item.durationMinutes, 0));
    const actualValues = episodes.map((item) => item.actualSleepMinutes).filter(Number.isFinite);
    const actualSleepMinutes = actualValues.length ? Math.min(960, actualValues.reduce((sum, value) => sum + value, 0)) : null;
    const stageMinutes = {};
    for (const episode of episodes) {
      for (const [label, value] of Object.entries(episode.stageMinutes)) {
        stageMinutes[label] = (stageMinutes[label] || 0) + (Number(value) || 0);
      }
    }
    const stageNote = Object.entries(stageMinutes).filter(([, value]) => value > 0).map(([label, value]) => `${label} ${Math.round(value)}m`).join(" · ");
    await SleepLog.findOneAndUpdate(
      { day, source: "health_connect" },
      {
        day,
        bedDate: main.bedDate,
        bedTime: main.bedTime,
        wakeDate: main.wakeDate,
        wakeTime: main.wakeTime,
        durationMinutes,
        actualSleepMinutes,
        elapsedMinutes: main.elapsedMinutes,
        source: "health_connect",
        stageMinutes,
        episodes: episodes.map(({ elapsedMinutes: _elapsed, stageMinutes: _stages, ...item }) => item),
        quality: null,
        notes: `${episodes.length > 1 ? `${episodes.length} sleep episodes · ` : ""}${stageNote}`.trim(),
      },
      { new: true, upsert: true, runValidators: true }
    );
  }
}

async function updateSleepDashboard(records) {
  const days = new Set(records.filter((item) => item.type === "sleep").map(sleepDay));
  await rebuildSleepDays(days);
}

function average(values) {
  const list = values.filter(Number.isFinite);
  return list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null;
}

function dailySummary(records, day) {
  const ofType = (type) => records.filter((record) => record.type === type);
  const sum = (type, key) => ofType(type).reduce((total, record) => total + (Number(record.data?.[key]) || 0), 0);
  const hearts = ofType("heart_rate").map((record) => ({ bpm: Number(record.data?.bpm), time: record.startTime })).filter((item) => Number.isFinite(item.bpm));
  const oxygen = ofType("oxygen").map((record) => ({ value: Number(record.data?.percentage), time: record.startTime })).filter((item) => Number.isFinite(item.value));
  const latestHeart = hearts.slice().sort((a, b) => b.time - a.time)[0];
  const latestOxygen = oxygen.slice().sort((a, b) => b.time - a.time)[0];
  const resting = ofType("resting_heart_rate").sort((a, b) => b.startTime - a.startTime)[0];
  const workouts = ofType("exercise").map((record) => ({
    type: record.data?.type || "Workout", title: record.data?.title || "",
    startTime: record.startTime, endTime: record.endTime,
    durationMinutes: Math.max(0, Math.round((record.endTime - record.startTime) / 60000)),
  }));
  return {
    day,
    steps: Math.round(sum("steps", "count")) || null,
    distanceMeters: sum("distance", "meters") || null,
    floors: sum("floors", "floors") || null,
    activeCaloriesKcal: sum("active_calories", "kilocalories") || null,
    totalCaloriesKcal: sum("total_calories", "kilocalories") || null,
    exerciseMinutes: workouts.length ? workouts.reduce((total, item) => total + item.durationMinutes, 0) : null,
    heartRate: {
      latest: latestHeart?.bpm ?? null,
      average: hearts.length ? Math.round(average(hearts.map((item) => Number(item.bpm)))) : null,
      minimum: hearts.length ? Math.min(...hearts.map((item) => Number(item.bpm))) : null,
      maximum: hearts.length ? Math.max(...hearts.map((item) => Number(item.bpm))) : null,
      resting: Number(resting?.data?.bpm) || null,
      measuredAt: latestHeart?.time || null,
    },
    oxygen: {
      latest: latestOxygen?.value ?? null,
      average: average(oxygen.map((item) => item.value)),
      minimum: oxygen.length ? Math.min(...oxygen.map((item) => item.value)) : null,
      maximum: oxygen.length ? Math.max(...oxygen.map((item) => item.value)) : null,
      measuredAt: latestOxygen?.time || null,
    },
    workouts,
  };
}

router.get("/", async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const raw = await WearableRecord.find({ startTime: { $gte: new Date(Date.now() - (days + 1) * DAY_MS) } }).sort({ startTime: -1 }).lean();
  const byDay = new Map();
  for (const record of raw) {
    const offset = Number(record.data?.zoneOffsetSeconds ?? record.data?.startOffsetSeconds ?? 0);
    const day = new Date(record.startTime.getTime() + offset * 1000).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(record);
  }
  const records = [...byDay.entries()].map(([day, items]) => dailySummary(items, day)).sort((a, b) => b.day.localeCompare(a.day)).slice(0, days);
  res.json({ records, latest: records[0] || null, rawCount: raw.length, stressAvailable: false });
});

router.post("/sync", async (req, res) => {
  if (!Array.isArray(req.body?.records) || req.body.records.length < 1) return res.status(400).json({ message: "Send at least one wearable record." });
  if (req.body.records.length > 500) return res.status(400).json({ message: "Wearable sync batches are limited to 500 records." });
  const records = req.body.records.map(cleanRecord).filter(Boolean);
  if (!records.length) return res.status(400).json({ message: "No valid wearable records were found." });
  const result = await WearableRecord.bulkWrite(records.map((record) => ({
    updateOne: { filter: { externalId: record.externalId }, update: { $set: record }, upsert: true },
  })), { ordered: false });
  await updateSleepDashboard(records);
  res.status(201).json({ received: records.length, inserted: result.upsertedCount, updated: result.modifiedCount, stressAvailable: false });
});

router.post("/reconcile", async (req, res) => {
  const all = req.body?.all === true;
  const from = new Date(req.body?.from);
  const to = new Date(req.body?.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return res.status(400).json({ message: "A valid wearable reconciliation range is required." });
  }

  const sourceFilter = { sourceApp: "com.sec.android.app.shealth" };
  const recordFilter = all
    ? sourceFilter
    : { ...sourceFilter, startTime: { $lt: to }, endTime: { $gte: from } };
  const affectedSleepDays = all
    ? []
    : (await WearableRecord.find({ ...recordFilter, type: "sleep" }).lean()).map(sleepDay);
  const removedRecords = await WearableRecord.deleteMany(recordFilter);
  const sleepFilter = all
    ? { source: "health_connect" }
    : { source: "health_connect", day: { $in: [...new Set(affectedSleepDays)] } };
  const removedSleepLogs = await SleepLog.deleteMany(sleepFilter);

  res.json({
    removedRecords: removedRecords.deletedCount,
    removedSleepLogs: removedSleepLogs.deletedCount,
  });
});

router.post("/sleep/replace", async (req, res) => {
  const all = req.body?.all === true;
  const from = new Date(req.body?.from);
  const to = new Date(req.body?.to);
  if (!all && (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from)) {
    return res.status(400).json({ message: "A valid sleep replacement range is required." });
  }
  const recordFilter = all
    ? { type: "sleep", sourceApp: "com.sec.android.app.shealth" }
    : { type: "sleep", sourceApp: "com.sec.android.app.shealth", startTime: { $lt: to }, endTime: { $gt: from } };
  const removedRecords = await WearableRecord.deleteMany(recordFilter);
  const syncedFilter = { $or: [{ source: "health_connect" }, { notes: /^Synced from Health Connect/ }] };
  const sleepFilter = all
    ? syncedFilter
    : { ...syncedFilter, day: { $gte: from.toISOString().slice(0, 10), $lte: to.toISOString().slice(0, 10) } };
  const removedLogs = await SleepLog.deleteMany(sleepFilter);
  res.json({ removedRecords: removedRecords.deletedCount, removedSleepLogs: removedLogs.deletedCount });
});

export default router;
