import { Router } from "express";
import PomodoroSession from "../models/PomodoroSession.js";
import { validateSession } from "../lib/pomodoro.js";

const router = Router();
router.get("/sessions", async (_req, res) => {
  try {
    res.json({ sessions: await PomodoroSession.find().sort({ startedAt: -1 }).lean() });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
router.put("/sessions/:id", async (req, res) => {
  let session;
  try {
    session = validateSession(req.body || {});
    if (session.sessionId !== req.params.id) throw new Error("Session ID mismatch.");
  } catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    // Immutable and idempotent: reconnects and multiple tabs cannot double count.
    const saved = await PomodoroSession.findOneAndUpdate(
      { sessionId: session.sessionId }, { $setOnInsert: session },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(saved);
  } catch (error) {
    if (error.code === 11000) return res.json(await PomodoroSession.findOne({ sessionId: session.sessionId }));
    res.status(500).json({ message: error.message });
  }
});
export default router;
