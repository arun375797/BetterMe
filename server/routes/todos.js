import { Router } from "express";
import Todo, { PRIORITIES } from "../models/Todo.js";
import TodoCategory from "../models/TodoCategory.js";
import TodoTemplate from "../models/TodoTemplate.js";

const router = Router();

// ── Categories ────────────────────────────────────────────────

router.get("/categories", async (req, res) => {
  const categories = await TodoCategory.find()
    .sort({ order: 1, createdAt: 1 })
    .lean();
  res.json({ categories });
});

router.post("/categories", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const color = String(req.body?.color || "#6ec8ff");
  const emoji = String(req.body?.emoji || "").trim().slice(0, 10);

  if (!name) {
    return res.status(400).json({ message: "Category name is required." });
  }

  const lastCat = await TodoCategory.findOne().sort({ order: -1 }).lean();
  const order = lastCat ? lastCat.order + 1 : 0;

  const category = await TodoCategory.create({ name, color, emoji, order });
  res.status(201).json(category);
});

router.patch("/categories/:id", async (req, res) => {
  const update = {};
  if (req.body?.name != null) update.name = String(req.body.name).trim();
  if (req.body?.color != null) update.color = String(req.body.color);
  if (req.body?.emoji != null)
    update.emoji = String(req.body.emoji).trim().slice(0, 10);
  if (req.body?.order != null) update.order = Number(req.body.order);

  const category = await TodoCategory.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, runValidators: true }
  );
  if (!category) {
    return res.status(404).json({ message: "Category not found." });
  }
  res.json(category);
});

router.delete("/categories/:id", async (req, res) => {
  const deleted = await TodoCategory.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Category not found." });
  }
  await Todo.updateMany(
    { categoryId: req.params.id },
    { $set: { categoryId: null } }
  );
  res.json({ ok: true });
});

// ── Todos ─────────────────────────────────────────────────────

function todoFields(body = {}) {
  const text = String(body.text || "").trim();
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "medium";
  const categoryId = body.categoryId || null;
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;

  if (!text) throw new Error("Todo text is required.");
  if (dueDate && Number.isNaN(dueDate.getTime())) throw new Error("Start date is invalid.");
  if (endDate && Number.isNaN(endDate.getTime())) throw new Error("End time is invalid.");
  if (endDate && (!dueDate || endDate <= dueDate)) {
    throw new Error("End time must be after start time.");
  }
  return { text, priority, categoryId, dueDate, endDate };
}

router.get("/templates", async (req, res) => {
  const templates = await TodoTemplate.find().sort({ createdAt: -1 }).lean();
  res.json({ templates });
});

router.post("/templates", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!name) return res.status(400).json({ message: "Template name is required." });
  if (!rawItems.length || rawItems.length > 100) {
    return res.status(400).json({ message: "A template needs 1–100 tasks." });
  }
  const items = rawItems.map((item) => ({
    text: String(item.text || "").trim(),
    priority: PRIORITIES.includes(item.priority) ? item.priority : "medium",
    categoryId: item.categoryId || null,
    startTime: /^\d{2}:\d{2}$/.test(item.startTime || "") ? item.startTime : "",
    endTime: /^\d{2}:\d{2}$/.test(item.endTime || "") ? item.endTime : "",
  }));
  if (items.some((item) => !item.text)) {
    return res.status(400).json({ message: "Every template task needs text." });
  }
  const template = await TodoTemplate.create({ name, items });
  res.status(201).json(template);
});

router.delete("/templates/:id", async (req, res) => {
  const deleted = await TodoTemplate.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Template not found." });
  res.json({ ok: true });
});

router.post("/bulk", async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!rawItems.length || rawItems.length > 100) {
    return res.status(400).json({ message: "Add between 1 and 100 tasks at a time." });
  }
  try {
    const todos = await Todo.insertMany(rawItems.map(todoFields));
    res.status(201).json({ todos });
  } catch (err) {
    res.status(400).json({ message: err.message || "Could not add tasks." });
  }
});

router.get("/", async (req, res) => {
  const filter = {};

  if (req.query.category === "none") {
    filter.categoryId = null;
  } else if (req.query.category) {
    filter.categoryId = req.query.category;
  }

  if (req.query.done === "true") filter.done = true;
  if (req.query.done === "false") filter.done = false;

  const todos = await Todo.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ todos });
});

router.post("/", async (req, res) => {
  try {
    const todo = await Todo.create(todoFields(req.body));
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ message: err.message || "Could not add task." });
  }
});

router.patch("/:id", async (req, res) => {
  const update = {};

  if (req.body?.text != null) {
    const t = String(req.body.text).trim();
    if (!t) return res.status(400).json({ message: "Text cannot be empty." });
    update.text = t;
  }
  if (req.body?.done != null) {
    update.done = Boolean(req.body.done);
    update.completedAt = update.done ? new Date() : null;
  }
  if (req.body?.priority != null && PRIORITIES.includes(req.body.priority)) {
    update.priority = req.body.priority;
  }
  if ("categoryId" in req.body) {
    update.categoryId = req.body.categoryId || null;
  }
  if ("dueDate" in req.body) {
    update.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  }
  if ("endDate" in req.body) {
    update.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
  }

  if (update.dueDate && Number.isNaN(update.dueDate.getTime())) {
    return res.status(400).json({ message: "Start date is invalid." });
  }
  if (update.endDate && Number.isNaN(update.endDate.getTime())) {
    return res.status(400).json({ message: "End time is invalid." });
  }
  if (update.dueDate && update.endDate && update.endDate <= update.dueDate) {
    return res.status(400).json({ message: "End time must be after start time." });
  }

  const todo = await Todo.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }
  res.json(todo);
});

router.delete("/:id", async (req, res) => {
  const deleted = await Todo.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Todo not found." });
  }
  res.json({ ok: true });
});

export default router;
