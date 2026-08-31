import { Router } from "express";
import Todo, { PRIORITIES } from "../models/Todo.js";
import TodoCategory from "../models/TodoCategory.js";

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
  const text = String(req.body?.text || "").trim();
  const priority = PRIORITIES.includes(req.body?.priority)
    ? req.body.priority
    : "medium";
  const categoryId = req.body?.categoryId || null;
  const dueDate =
    req.body?.dueDate ? new Date(req.body.dueDate) : null;

  if (!text) {
    return res.status(400).json({ message: "Todo text is required." });
  }

  const todo = await Todo.create({ text, priority, categoryId, dueDate });
  res.status(201).json(todo);
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
