import { Router } from "express";
import Subject from "../models/Subject.js";
import StudyGoal, { GOAL_SECTIONS } from "../models/StudyGoal.js";

const router = Router();

function parseSection(value) {
  return GOAL_SECTIONS.includes(value) ? value : null;
}

async function findSubject(slug) {
  return Subject.findOne({ slug }).select("_id slug shortName").lean();
}

router.get("/subjects/:slug/goals", async (req, res) => {
  try {
    const section = parseSection(req.query.section);
    if (!section) {
      return res.status(400).json({ message: "section must be theory or practical." });
    }
    const subject = await findSubject(req.params.slug);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    const goals = await StudyGoal.find({ subject: subject._id, section })
      .sort({ done: 1, order: 1, createdAt: 1 })
      .lean();
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/subjects/:slug/goals", async (req, res) => {
  try {
    const section = parseSection(req.body?.section);
    const text = String(req.body?.text || "").trim();
    if (!section) {
      return res.status(400).json({ message: "section must be theory or practical." });
    }
    if (!text) {
      return res.status(400).json({ message: "What you want to study is required." });
    }
    const subject = await findSubject(req.params.slug);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    const last = await StudyGoal.findOne({ subject: subject._id, section })
      .sort({ order: -1 })
      .lean();
    const goal = await StudyGoal.create({
      subject: subject._id,
      section,
      text,
      order: last ? last.order + 1 : 0,
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/goals/:id", async (req, res) => {
  try {
    const update = {};
    if (req.body?.text != null) {
      const text = String(req.body.text).trim();
      if (!text) {
        return res.status(400).json({ message: "Text cannot be empty." });
      }
      update.text = text;
    }
    if (req.body?.done != null) {
      update.done = Boolean(req.body.done);
      update.completedAt = update.done ? new Date() : null;
    }
    const goal = await StudyGoal.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/goals/:id", async (req, res) => {
  try {
    const deleted = await StudyGoal.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Goal not found." });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
