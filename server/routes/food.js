import { Router } from "express";
import FoodItem, { GI, SLOTS } from "../models/FoodItem.js";
import MealLog, { STATUSES } from "../models/MealLog.js";

const router = Router();

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanItem(body) {
  const name = String(body?.name || "").trim();
  const style = String(body?.style || "").trim();
  const instructions = String(body?.instructions || "").trim();
  const sugarNote = String(body?.sugarNote || "").trim();
  const glycemicIndex = body?.glycemicIndex || "medium";
  const slots = Array.isArray(body?.slots)
    ? [...new Set(body.slots.filter((item) => SLOTS.includes(item)))]
    : [];

  if (!name) return { error: "Food name is required." };
  if (!style) return { error: "Food style is required." };
  if (!slots.length) return { error: "Pick at least one meal time." };
  if (!GI.includes(glycemicIndex)) {
    return { error: "Glycemic index must be low, medium, or high." };
  }

  return {
    data: {
      name,
      style,
      slots,
      instructions,
      sugarNote,
      glycemicIndex,
      carbsG: num(body?.carbsG),
      fiberG: num(body?.fiberG),
      proteinG: num(body?.proteinG),
      fatG: num(body?.fatG),
    },
  };
}

function dayKey(value) {
  const raw = String(value || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

function cleanLog(body) {
  const day = dayKey(body?.day);
  const slot = body?.slot;
  const status = body?.status;
  if (!day) return { error: "Date is required." };
  if (!SLOTS.includes(slot)) return { error: "Choose a meal time." };
  if (!STATUSES.includes(status)) {
    return { error: "Mark the meal as eaten or skipped." };
  }

  const glycemicIndex = body?.glycemicIndex || "medium";
  if (!GI.includes(glycemicIndex)) {
    return { error: "Glycemic index must be low, medium, or high." };
  }

  return {
    data: {
      day,
      slot,
      status,
      foodName: String(body?.foodName || "").trim(),
      sugarNote: String(body?.sugarNote || "").trim(),
      glycemicIndex,
      carbsG: num(body?.carbsG),
      fiberG: num(body?.fiberG),
      proteinG: num(body?.proteinG),
      fatG: num(body?.fatG),
    },
  };
}

router.get("/items", async (_req, res) => {
  const items = await FoodItem.find().sort({ favorite: -1, name: 1 }).lean();
  res.json({ items });
});

router.get("/items/:id", async (req, res) => {
  const item = await FoodItem.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Food not found." });
  res.json(item);
});

router.post("/items", async (req, res) => {
  const cleaned = cleanItem(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const item = await FoodItem.create(cleaned.data);
  res.status(201).json(item);
});

router.patch("/items/:id", async (req, res) => {
  if (
    req.body &&
    Object.prototype.hasOwnProperty.call(req.body, "favorite") &&
    !req.body.name
  ) {
    const item = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { favorite: Boolean(req.body.favorite), demo: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Food not found." });
    return res.json(item);
  }

  const cleaned = cleanItem(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const item = await FoodItem.findByIdAndUpdate(
    req.params.id,
    { ...cleaned.data, demo: false },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!item) return res.status(404).json({ message: "Food not found." });
  res.json(item);
});

router.delete("/items/:id", async (req, res) => {
  const deleted = await FoodItem.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Food not found." });
  res.json({ ok: true });
});

router.get("/logs", async (_req, res) => {
  const logs = await MealLog.find().sort({ day: -1, slot: 1 }).lean();
  res.json({ logs });
});

router.post("/logs", async (req, res) => {
  const cleaned = cleanLog(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const log = await MealLog.findOneAndUpdate(
    { day: cleaned.data.day, slot: cleaned.data.slot },
    cleaned.data,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(log);
});

router.delete("/logs/:id", async (req, res) => {
  const deleted = await MealLog.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Log not found." });
  res.json({ ok: true });
});

export default router;
