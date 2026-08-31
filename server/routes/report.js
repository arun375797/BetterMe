import { Router } from "express";
import SugarReading from "../models/SugarReading.js";
import ExerciseSession from "../models/ExerciseSession.js";
import MealLog from "../models/MealLog.js";
import SleepLog from "../models/SleepLog.js";
import { computeReportStats } from "../lib/reportStats.js";

const router = Router();

router.get("/stats", async (_req, res) => {
  const [sugarReadings, exerciseSessions, mealLogs, sleepLogs] =
    await Promise.all([
      SugarReading.find().sort({ recordedAt: -1 }).lean(),
      ExerciseSession.find().sort({ recordedAt: -1 }).lean(),
      MealLog.find().sort({ day: -1 }).lean(),
      SleepLog.find().sort({ day: -1 }).lean(),
    ]);

  const report = computeReportStats({
    sugarReadings,
    exerciseSessions,
    mealLogs,
    sleepLogs,
  });

  res.json(report);
});

export default router;
