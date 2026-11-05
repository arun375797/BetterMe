import { Router } from "express";
import { randomUUID } from "node:crypto";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import StudyGoal from "../models/StudyGoal.js";
import PlanItem from "../models/PlanItem.js";
import StudyLog from "../models/StudyLog.js";
import StudySettings from "../models/StudySettings.js";
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

router.delete("/subjects/:slug", async (req, res) => {
  let session;
  try {
    session = await Subject.startSession();
    let deleted = false;
    await session.withTransaction(async () => {
      deleted = false;
      const subject = await Subject.findOne({ slug: req.params.slug }).session(session);
      if (!subject) return;
      const topics = await Topic.find({ subject: subject._id }).select("_id").session(session).lean();
      const ids = topics.map((topic) => topic._id);
      await Question.deleteMany({ topic: { $in: ids } }).session(session);
      await Question.updateMany({ relatedSection: { $in: ids } }, { $set: { relatedSection: null } }).session(session);
      await Topic.deleteMany({ subject: subject._id }).session(session);
      await StudyGoal.deleteMany({ subject: subject._id }).session(session);
      await PlanItem.deleteMany({ subject: subject._id }).session(session);
      await StudyLog.deleteMany({ subject: subject._id }).session(session);
      const settings = await StudySettings.findOne().session(session);
      if (settings) {
        for (const row of settings.rotation) {
          row.subjects = row.subjects.filter((id) => String(id) !== String(subject._id));
          if (String(row.subject) === String(subject._id)) row.subject = null;
        }
        for (const key of Object.keys(settings.focus || {})) {
          if (key.startsWith(`${subject._id}:`)) delete settings.focus[key];
        }
        settings.markModified("focus");
        settings.subjectsInitialized = true;
        await settings.save({ session });
      } else {
        await StudySettings.create([{ subjectsInitialized: true }], { session });
      }
      await Subject.deleteOne({ _id: subject._id }).session(session);
      deleted = true;
    });
    if (!deleted) return res.status(404).json({ message: "Language or subject not found." });
    memoClear();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session?.endSession();
  }
});

export default router;
