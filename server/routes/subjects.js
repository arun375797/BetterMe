import { Router } from "express";
import { randomUUID } from "node:crypto";
import Subject from "../models/Subject.js";
import { memoClear } from "../memo.js";

const router = Router();
const accents = new Set(["teal", "gold", "coral", "cyan", "violet"]);
const reserved = new Set(["plan"]);

router.post("/subjects", async (req, res) => {
  const { name, shortName, description = "", accent = "teal" } = req.body || {};
  if (
    typeof name !== "string" || !name.trim() || name.trim().length > 80 ||
    (shortName !== undefined && (typeof shortName !== "string" || shortName.trim().length > 24)) ||
    typeof description !== "string" || description.length > 500 || !accents.has(accent)
  ) {
    return res.status(400).json({ message: "Enter a name (up to 80 characters), a sidebar label (up to 24), and a valid color." });
  }
  try {
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (await Subject.findOne({ name: new RegExp(`^${escapedName}$`, "i") })) {
      return res.status(409).json({ message: "That language or subject already exists." });
    }
    const base = name.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/\+/g, "-plus-").replace(/#/g, "-sharp-")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "subject";
    let slug = base;
    if (reserved.has(slug) || await Subject.findOne({ slug })) {
      slug = `${base}-${randomUUID().slice(0, 8)}`;
    }
    const last = await Subject.findOne().sort({ order: -1 }).lean();
    const subject = await Subject.create({
      name: name.trim(), shortName: shortName?.trim() || name.trim().slice(0, 24),
      slug, description: description.trim(), accent, order: (last?.order || 0) + 1,
    });
    memoClear("learning");
    memoClear("plan");
    res.status(201).json(subject);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      message: error.code === 11000 ? "That language or subject already exists." : error.message,
    });
  }
});

export default router;
