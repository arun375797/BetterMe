import { Router } from "express";
import PersonalityItem, {
  BOOK_STATUSES,
  SECTIONS,
} from "../models/PersonalityItem.js";

const router = Router();

function cleanPayload(body, { partial = false } = {}) {
  const data = {};

  if (body.section !== undefined || !partial) {
    const section = String(body?.section || "").trim();
    if (!SECTIONS.includes(section)) {
      return { error: "Choose a valid personality section." };
    }
    data.section = section;
  }

  if (body.title !== undefined || !partial) {
    const title = String(body?.title || "").trim();
    if (!title) {
      return { error: "A title is required." };
    }
    data.title = title;
  }

  if (body.subtitle !== undefined) {
    data.subtitle = String(body.subtitle || "").trim();
  }

  if (body.details !== undefined) {
    data.details = String(body.details || "");
  }

  if (body.status !== undefined) {
    const status = String(body.status || "want");
    if (!BOOK_STATUSES.includes(status)) {
      return { error: "Book status must be want or read." };
    }
    data.status = status;
  }

  return { data };
}

router.get("/", async (req, res) => {
  const section = req.query.section;
  const filter = SECTIONS.includes(section) ? { section } : {};
  const items = await PersonalityItem.find(filter)
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ items });
});

router.get("/:id", async (req, res) => {
  const item = await PersonalityItem.findById(req.params.id).lean();
  if (!item) {
    return res.status(404).json({ message: "Item not found." });
  }
  res.json(item);
});

router.post("/", async (req, res) => {
  const cleaned = cleanPayload(req.body);
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  if (cleaned.data.section !== "books") {
    cleaned.data.status = "want";
  }
  const item = await PersonalityItem.create(cleaned.data);
  res.status(201).json(item);
});

router.patch("/:id", async (req, res) => {
  const cleaned = cleanPayload(req.body, { partial: true });
  if (cleaned.error) {
    return res.status(400).json({ message: cleaned.error });
  }
  const item = await PersonalityItem.findByIdAndUpdate(
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
  const deleted = await PersonalityItem.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Item not found." });
  }
  res.json({ ok: true });
});

export default router;
