import { Router } from "express";
import PlanItem, { PLAN_PRIORITIES } from "../models/PlanItem.js";
import Subject from "../models/Subject.js";

const router = Router();
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function dayKey(value) {
  const text = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function todayKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sortItems(a, b) {
  const dateCmp = String(a.date).localeCompare(String(b.date));
  if (dateCmp) return dateCmp;
  const p =
    (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
  if (p) return p;
  if (a.order !== b.order) return a.order - b.order;
  return String(a._id).localeCompare(String(b._id));
}

function slimItem(item) {
  return {
    _id: item._id,
    subject: item.subject,
    parent: item.parent || null,
    title: item.title,
    date: item.date,
    priority: item.priority,
    learned: Boolean(item.learned),
    learnedAt: item.learnedAt || null,
    order: item.order || 0,
    createdAt: item.createdAt,
  };
}

function topicComplete(item, childrenByParent) {
  const kids = childrenByParent.get(String(item._id)) || [];
  if (!kids.length) return Boolean(item.learned);
  return kids.every((child) => topicComplete(child, childrenByParent));
}

function childrenMap(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.parent ? String(item.parent) : "";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  for (const list of map.values()) list.sort(sortItems);
  return map;
}

function subjectCards(subjects, items) {
  const bySubject = new Map();
  for (const item of items) {
    const sid = String(item.subject?._id || item.subject);
    if (!bySubject.has(sid)) bySubject.set(sid, []);
    bySubject.get(sid).push(item);
  }

  return subjects.map((subject) => {
    const list = bySubject.get(String(subject._id)) || [];
    const kids = childrenMap(list);
    const roots = (kids.get("") || []).slice().sort(sortItems);
    const segments = roots.map((root) => ({
      id: String(root._id),
      learned: topicComplete(root, kids),
    }));
    const learned = segments.filter((seg) => seg.learned).length;
    return {
      _id: subject._id,
      name: subject.name,
      slug: subject.slug,
      shortName: subject.shortName,
      description: subject.description,
      accent: subject.accent,
      total: segments.length,
      learned,
      remaining: Math.max(0, segments.length - learned),
      segments,
    };
  });
}

async function descendantIds(rootId) {
  const ids = [];
  let frontier = [rootId];
  while (frontier.length) {
    const children = await PlanItem.find({ parent: { $in: frontier } })
      .select("_id")
      .lean();
    frontier = children.map((row) => row._id);
    ids.push(...frontier);
  }
  return ids;
}

async function setLearnedCascade(item, learned) {
  const ids = [item._id, ...(await descendantIds(item._id))];
  await PlanItem.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        learned,
        learnedAt: learned ? new Date() : null,
      },
    }
  );

  let parentId = item.parent;
  while (parentId) {
    const parent = await PlanItem.findById(parentId);
    if (!parent) break;
    const children = await PlanItem.find({ parent: parentId }).lean();
    const allLearned = children.length
      ? children.every((child) => child.learned)
      : learned;
    parent.learned = allLearned;
    parent.learnedAt = allLearned ? parent.learnedAt || new Date() : null;
    await parent.save();
    parentId = parent.parent;
  }
}

async function loadOverview() {
  const [subjects, items] = await Promise.all([
    Subject.find().sort({ order: 1, name: 1 }).lean(),
    PlanItem.find().populate("subject", "name slug shortName accent").lean(),
  ]);
  const sorted = items.slice().sort(sortItems);
  const today = todayKey();
  return {
    todayKey: today,
    subjects: subjectCards(subjects, sorted),
    items: sorted.map(slimItem),
    today: (() => {
      const kids = childrenMap(sorted);
      return (kids.get("") || [])
        .filter((item) => item.date <= today && !topicComplete(item, kids))
        .map(slimItem);
    })(),
  };
}

router.get("/", async (req, res) => {
  try {
    res.json(await loadOverview());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/subject/:slug", async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.slug }).lean();
    if (!subject) {
      return res.status(404).json({ message: "Subject not found." });
    }
    const items = await PlanItem.find({ subject: subject._id }).lean();
    const overview = await loadOverview();
    const card = overview.subjects.find(
      (row) => String(row._id) === String(subject._id)
    );
    res.json({
      subject,
      card,
      items: items.slice().sort(sortItems).map(slimItem),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const date = dayKey(req.body?.date);
    const priority = PLAN_PRIORITIES.includes(req.body?.priority)
      ? req.body.priority
      : "medium";
    const subject = await Subject.findById(req.body?.subject).lean();
    if (!title) {
      return res.status(400).json({ message: "Topic is required." });
    }
    if (!date) {
      return res.status(400).json({ message: "Pick a date." });
    }
    if (!subject) {
      return res.status(400).json({ message: "Pick a subject." });
    }

    let parent = null;
    if (req.body?.parent) {
      parent = await PlanItem.findById(req.body.parent);
      if (!parent || String(parent.subject) !== String(subject._id)) {
        return res.status(400).json({ message: "Subtopic parent is invalid." });
      }
    }

    const last = await PlanItem.findOne({
      subject: subject._id,
      parent: parent?._id || null,
    })
      .sort({ order: -1 })
      .lean();

    const item = await PlanItem.create({
      subject: subject._id,
      parent: parent?._id || null,
      title,
      date,
      priority,
      order: last ? last.order + 1 : 0,
    });

    if (parent?.learned) {
      parent.learned = false;
      parent.learnedAt = null;
      await parent.save();
    }

    res.status(201).json(slimItem(item));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const item = await PlanItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Plan item not found." });
    }

    if (req.body?.title != null) {
      const title = String(req.body.title).trim();
      if (!title) {
        return res.status(400).json({ message: "Topic cannot be empty." });
      }
      item.title = title;
    }
    if (req.body?.date != null) {
      const date = dayKey(req.body.date);
      if (!date) {
        return res.status(400).json({ message: "Pick a date." });
      }
      item.date = date;
    }
    if (
      req.body?.priority != null &&
      PLAN_PRIORITIES.includes(req.body.priority)
    ) {
      item.priority = req.body.priority;
    }
    if (req.body?.subject != null && !item.parent) {
      const subject = await Subject.findById(req.body.subject).lean();
      if (!subject) {
        return res.status(400).json({ message: "Pick a subject." });
      }
      item.subject = subject._id;
      await PlanItem.updateMany(
        { parent: item._id },
        { $set: { subject: subject._id } }
      );
    }

    if (req.body?.learned != null) {
      await item.save();
      await setLearnedCascade(item, Boolean(req.body.learned));
      const fresh = await PlanItem.findById(item._id).lean();
      return res.json(slimItem(fresh));
    }

    await item.save();
    res.json(slimItem(item));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const item = await PlanItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Plan item not found." });
    }
    const ids = [item._id, ...(await descendantIds(item._id))];
    await PlanItem.deleteMany({ _id: { $in: ids } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
