import { Router } from "express";
import VitaminItem, { TIMINGS, FOOD, KINDS } from "../models/VitaminItem.js";

const router = Router();

function cleanPayload(body) {
  const name = String(body?.name || "").trim();
  const kind = body?.kind;
  const dose = String(body?.dose || "").trim();
  const notes = String(body?.notes || "").trim();
  const foodTiming = body?.foodTiming || "anytime";
  const timings = Array.isArray(body?.timings)
    ? [...new Set(body.timings.filter((item) => TIMINGS.includes(item)))]
    : [];

  if (!name) {
    return { error: "Name is required." };
  }
  if (!KINDS.includes(kind)) {
    return { error: "Choose vitamin or tablet." };
  }
  if (!timings.length) {
    return { error: "Pick at least one time of day." };
  }
  if (!FOOD.includes(foodTiming)) {
    return { error: "Food timing is invalid." };
  }

  return { data: { name, kind, dose, timings, foodTiming, notes } };
}

router.get("/", async (_req, res) => {
  const items = await VitaminItem.find().sort({ kind: 1, name: 1 }).lean();
  res.json({ items });
});

router.post("/", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const item = await VitaminItem.create(cleaned.data);
  res.status(201).json(item);
});

router.patch("/:id", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const item = await VitaminItem.findByIdAndUpdate(
    req.params.id,
    cleaned.data,
    { new: true, runValidators: true }
  );
  if (!item) {
    return res.status(404).json({ message: "Item not found." });
  }
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  const deleted = await VitaminItem.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Item not found." });
  }
  res.json({ ok: true });
});

export default router;
