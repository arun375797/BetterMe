import { Router } from "express";
import mongoose from "mongoose";
import MusicTrack from "../models/MusicTrack.js";
import MusicCategory from "../models/MusicCategory.js";
import { parseYoutubeId, youtubeWatchUrl } from "../lib/youtube.js";

const router = Router();

const COLORS = [
  "#3ce6d4",
  "#6ec8ff",
  "#e8c36a",
  "#b9a6ff",
  "#e88b7a",
  "#a8e890",
  "#f0a0d0",
];

function isId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

function cleanTrack(body, { partial = false } = {}) {
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

  if (body?.categoryId !== undefined) {
    if (body.categoryId === "" || body.categoryId == null) {
      data.categoryId = null;
    } else if (!isId(body.categoryId)) {
      return { error: "Pick a valid category." };
    } else {
      data.categoryId = body.categoryId;
    }
  } else if (!partial) {
    data.categoryId = null;
  }

  if (body?.favorite != null) {
    data.favorite = Boolean(body.favorite);
  } else if (!partial) {
    data.favorite = false;
  }

  if (body?.order != null) {
    const order = Number(body.order);
    if (!Number.isFinite(order)) return { error: "Order is invalid." };
    data.order = order;
  }

  return { data };
}

function cleanCategory(body, { partial = false } = {}) {
  const data = {};
  if (body?.name != null || !partial) {
    const name = String(body?.name || "").trim();
    if (!name) return { error: "Give the category a name." };
    if (name.length > 40) return { error: "Category name is too long." };
    data.name = name;
  }
  if (body?.color != null) {
    const color = String(body.color || "").trim();
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return { error: "Color is invalid." };
    }
    if (color) data.color = color;
  }
  return { data };
}

async function listPayload() {
  const [categories, tracks] = await Promise.all([
    MusicCategory.find().sort({ order: 1, createdAt: 1 }).lean(),
    MusicTrack.find().sort({ order: 1, createdAt: 1 }).lean(),
  ]);
  return { categories, tracks };
}

router.get("/", async (_req, res) => {
  res.json(await listPayload());
});

router.post("/categories", async (req, res) => {
  const cleaned = cleanCategory(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const last = await MusicCategory.findOne().sort({ order: -1 }).lean();
  const category = await MusicCategory.create({
    ...cleaned.data,
    color: cleaned.data.color || COLORS[(last?.order || 0) % COLORS.length],
    order: last ? last.order + 1 : 0,
  });
  res.status(201).json({ category, ...(await listPayload()) });
});

router.patch("/categories/:id", async (req, res) => {
  const cleaned = cleanCategory(req.body, { partial: true });
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const category = await MusicCategory.findByIdAndUpdate(
    req.params.id,
    cleaned.data,
    { new: true, runValidators: true }
  );
  if (!category) {
    return res.status(404).json({ message: "Category not found." });
  }
  res.json({ category, ...(await listPayload()) });
});

router.delete("/categories/:id", async (req, res) => {
  const deleted = await MusicCategory.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Category not found." });
  }
  await MusicTrack.updateMany(
    { categoryId: req.params.id },
    { $set: { categoryId: null } }
  );
  res.json({ ok: true, ...(await listPayload()) });
});

router.post("/", async (req, res) => {
  const cleaned = cleanTrack(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  if (cleaned.data.categoryId) {
    const existsCat = await MusicCategory.findById(cleaned.data.categoryId);
    if (!existsCat) {
      return res.status(400).json({ message: "That category was removed." });
    }
  }
  const exists = await MusicTrack.findOne({ youtubeId: cleaned.data.youtubeId });
  if (exists) {
    return res.status(400).json({ message: "That song is already on the list." });
  }
  const last = await MusicTrack.findOne().sort({ order: -1 }).lean();
  const track = await MusicTrack.create({
    ...cleaned.data,
    order: last ? last.order + 1 : 0,
  });
  res.status(201).json({ track, ...(await listPayload()) });
});

router.patch("/:id", async (req, res) => {
  if (String(req.params.id) === "categories") {
    return res.status(404).json({ message: "Song not found." });
  }
  const cleaned = cleanTrack(req.body, { partial: true });
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  if (cleaned.data.youtubeId) {
    const clash = await MusicTrack.findOne({
      youtubeId: cleaned.data.youtubeId,
      _id: { $ne: req.params.id },
    });
    if (clash) {
      return res.status(400).json({ message: "That song is already on the list." });
    }
  }
  if (cleaned.data.categoryId) {
    const existsCat = await MusicCategory.findById(cleaned.data.categoryId);
    if (!existsCat) {
      return res.status(400).json({ message: "That category was removed." });
    }
  }
  const track = await MusicTrack.findByIdAndUpdate(req.params.id, cleaned.data, {
    new: true,
    runValidators: true,
  });
  if (!track) {
    return res.status(404).json({ message: "Song not found." });
  }
  res.json({ track, ...(await listPayload()) });
});

router.delete("/:id", async (req, res) => {
  const deleted = await MusicTrack.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Song not found." });
  }
  res.json({ ok: true, ...(await listPayload()) });
});

export default router;
