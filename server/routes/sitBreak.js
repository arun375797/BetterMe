import { Router } from "express";
import SitBreakVideo from "../models/SitBreakVideo.js";
import { parseYoutubeId, youtubeWatchUrl } from "../lib/youtube.js";
import { ensureSitBreakVideos } from "../seed.js";

const router = Router();

function cleanPayload(body, { partial = false } = {}) {
  const data = {};

  if (body?.title != null || !partial) {
    const title = String(body?.title || "").trim();
    if (!title) return { error: "Give this a title." };
    if (title.length > 120) return { error: "Title is too long." };
    data.title = title;
  }

  if (body?.youtubeUrl != null || body?.youtubeId != null || !partial) {
    const youtubeId = parseYoutubeId(body?.youtubeId || body?.youtubeUrl);
    if (!youtubeId) return { error: "Paste a valid YouTube link." };
    data.youtubeId = youtubeId;
    data.youtubeUrl = youtubeWatchUrl(youtubeId);
  }

  if (body?.durationSeconds != null || body?.durationMinutes != null) {
    const minutes = body?.durationMinutes;
    const seconds =
      body?.durationSeconds != null
        ? Number(body.durationSeconds)
        : minutes === "" || minutes == null
          ? null
          : Number(minutes) * 60;
    if (seconds == null || seconds === 0) {
      data.durationSeconds = null;
    } else if (!Number.isFinite(seconds) || seconds < 1 || seconds > 7200) {
      return { error: "Duration must be between 1 minute and 2 hours." };
    } else {
      data.durationSeconds = Math.round(seconds);
    }
  } else if (!partial) {
    data.durationSeconds = null;
  }

  if (body?.order != null) {
    const order = Number(body.order);
    if (!Number.isFinite(order)) return { error: "Order is invalid." };
    data.order = order;
  }

  return { data };
}

router.get("/", async (_req, res) => {
  await ensureSitBreakVideos();
  const videos = await SitBreakVideo.find().sort({ order: 1, createdAt: 1 }).lean();
  res.json({ videos });
});

router.post("/", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const exists = await SitBreakVideo.findOne({ youtubeId: cleaned.data.youtubeId });
  if (exists) {
    return res.status(400).json({ message: "That video is already on the list." });
  }
  const last = await SitBreakVideo.findOne().sort({ order: -1 }).lean();
  const video = await SitBreakVideo.create({
    ...cleaned.data,
    seeded: false,
    order: last ? last.order + 1 : 0,
  });
  res.status(201).json({ video });
});

router.patch("/:id", async (req, res) => {
  const cleaned = cleanPayload(req.body, { partial: true });
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  if (cleaned.data.youtubeId) {
    const clash = await SitBreakVideo.findOne({
      youtubeId: cleaned.data.youtubeId,
      _id: { $ne: req.params.id },
    });
    if (clash) {
      return res.status(400).json({ message: "That video is already on the list." });
    }
  }
  const video = await SitBreakVideo.findByIdAndUpdate(req.params.id, cleaned.data, {
    new: true,
    runValidators: true,
  });
  if (!video) {
    return res.status(404).json({ message: "Video not found." });
  }
  res.json({ video });
});

router.delete("/:id", async (req, res) => {
  const deleted = await SitBreakVideo.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Video not found." });
  }
  res.json({ ok: true });
});

export default router;
