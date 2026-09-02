import { Router } from "express";
import ExerciseSession, { KINDS } from "../models/ExerciseSession.js";
import { parseWallClock } from "../lib/wallClock.js";

const router = Router();

function cleanPayload(body) {
  const kind = body?.kind;
  const what = String(body?.what || "").trim();
  const why = String(body?.why || "").trim();
  const durationMinutes = Number(body?.durationMinutes);
  const feltRaw = body?.felt;
  const felt =
    feltRaw === "" || feltRaw == null ? null : Number(feltRaw);
  const recordedAt = parseWallClock(body);

  if (!KINDS.includes(kind)) {
    return { error: "Choose yoga, badminton, or weight training." };
  }
  if (!what) {
    return { error: "Say what you did." };
  }
  if (!why) {
    return { error: "Say why you did it today." };
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    return { error: "Enter how many minutes you trained." };
  }
  if (felt != null && (!Number.isFinite(felt) || felt < 1 || felt > 10)) {
    return { error: "Felt score must be 1 to 10." };
  }
  if (!recordedAt) {
    return { error: "Pick a date and time." };
  }

  return {
    data: {
      kind,
      what,
      why,
      durationMinutes,
      felt,
      recordedAt,
    },
  };
}

router.get("/", async (req, res) => {
  const kind = req.query.kind;
  const filter = KINDS.includes(kind) ? { kind } : {};
  const sessions = await ExerciseSession.find(filter)
    .sort({ recordedAt: -1 })
    .lean();
  res.json({ sessions });
});

router.post("/", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const session = await ExerciseSession.create(cleaned.data);
  res.status(201).json(session);
});

router.patch("/:id", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const session = await ExerciseSession.findByIdAndUpdate(
    req.params.id,
    cleaned.data,
    { new: true, runValidators: true }
  );
  if (!session) {
    return res.status(404).json({ message: "Session not found." });
  }
  res.json(session);
});

router.delete("/:id", async (req, res) => {
  const deleted = await ExerciseSession.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Session not found." });
  }
  res.json({ ok: true });
});

export default router;
