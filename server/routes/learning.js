import { Router } from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";

const router = Router();
const SECTIONS = ["theory", "practical"];

function newSolutionId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeSolutions(raw, fallback = {}) {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((item) => ({
      id: String(item.id || item._id || newSolutionId()),
      language: item.language || "javascript",
      code: item.code || "",
      logic: item.logic || "",
    }));
  }
  if (fallback.code || fallback.notes) {
    return [
      {
        id: "legacy",
        language: fallback.language || "javascript",
        code: fallback.code || "",
        logic: fallback.notes || "",
      },
    ];
  }
  return [
    { id: newSolutionId(), language: "javascript", code: "", logic: "" },
  ];
}

function withSolutions(question) {
  const obj = question.toObject ? question.toObject() : { ...question };
  obj.solutions = normalizeSolutions(obj.solutions, obj);
  return obj;
}

function nestTopics(topics) {
  const objs = topics.map((t) => (t.toObject ? t.toObject() : { ...t }));
  const byParent = new Map();
  for (const item of objs) {
    const key = item.parent ? String(item.parent) : "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }

  function kids(id) {
    return (byParent.get(String(id)) || [])
      .sort((a, b) => (a.slNo ?? a.order ?? 0) - (b.slNo ?? b.order ?? 0))
      .map((child) => ({
        ...child,
        nested: kids(child._id),
      }));
  }

  const mains = (byParent.get("root") || []).sort((a, b) => {
    const star =
      Number(Boolean(b.highlighted)) - Number(Boolean(a.highlighted));
    if (star !== 0) return star;
    return (a.slNo ?? a.order) - (b.slNo ?? b.order);
  });

  return mains.map((main) => ({
    ...main,
    subtopics: kids(main._id),
  }));
}

function statsFromTopics(topics, questionCount = 0) {
  const bySection = {};
  for (const section of SECTIONS) {
    const inSection = topics.filter((t) => (t.section || "theory") === section);
    const mains = inSection.filter((t) => !t.parent);
    const children = inSection.filter((t) => t.parent);
    bySection[section] = {
      mainTopics: mains.length,
      items: section === "practical" ? 0 : children.length,
      sections: children.length,
    };
  }
  bySection.practical.items = questionCount;
  const inReview = topics.filter((t) => t.parent && t.inReview).length;
  return {
    theory: bySection.theory,
    practical: bySection.practical,
    mainTopics: bySection.theory.mainTopics + bySection.practical.mainTopics,
    subtopics: bySection.theory.items,
    questions: questionCount,
    inReview,
    total: topics.length,
  };
}

router.get("/review", async (_req, res) => {
  try {
    const items = await Topic.find({
      inReview: true,
      parent: { $ne: null },
    })
      .populate("subject")
      .populate("parent")
      .sort({ updatedAt: -1 });

    const rank = { hard: 0, ec: 1, medium: 2, easy: 3 };
    items.sort(
      (a, b) =>
        (rank[a.difficulty] ?? 2) - (rank[b.difficulty] ?? 2) ||
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.json(
      items.map((item) => {
        const obj = item.toObject();
        return {
          ...obj,
          parentTopic: obj.parent,
          parent: obj.parent?._id || obj.parent,
        };
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/subjects", async (_req, res) => {
  try {
    const subjects = await Subject.find().sort({ order: 1 });
    const topics = await Topic.find();
    const questions = await Question.find().select("topic");
    const topicById = Object.fromEntries(
      topics.map((t) => [String(t._id), t])
    );
    const questionsBySubject = {};
    for (const q of questions) {
      const topic = topicById[String(q.topic)];
      if (!topic) continue;
      const sid = String(topic.subject);
      questionsBySubject[sid] = (questionsBySubject[sid] || 0) + 1;
    }

    const payload = subjects.map((subject) => {
      const subjectTopics = topics.filter(
        (t) => String(t.subject) === String(subject._id)
      );
      return {
        ...subject.toObject(),
        stats: statsFromTopics(
          subjectTopics,
          questionsBySubject[String(subject._id)] || 0
        ),
      };
    });

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/subjects/:slug", async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.slug });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const all = await Topic.find({ subject: subject._id }).sort({
      slNo: 1,
      order: 1,
      createdAt: 1,
    });
    const questionCount = await Question.countDocuments({
      topic: { $in: all.map((t) => t._id) },
    });

    const section = SECTIONS.includes(req.query.section)
      ? req.query.section
      : null;
    const scoped = section
      ? all.filter((t) => (t.section || "theory") === section)
      : [];

    let topics = section ? nestTopics(scoped) : [];
    if (section === "practical" && topics.length) {
      const childIds = topics.flatMap((t) =>
        (t.subtopics || []).map((s) => s._id)
      );
      let countMap = {};
      if (childIds.length) {
        const counts = await Question.aggregate([
          { $match: { topic: { $in: childIds } } },
          { $group: { _id: "$topic", n: { $sum: 1 } } },
        ]);
        countMap = Object.fromEntries(
          counts.map((c) => [String(c._id), c.n])
        );
      }
      topics = topics.map((t) => ({
        ...t,
        subtopics: (t.subtopics || []).map((s) => ({
          ...s,
          questionCount: countMap[String(s._id)] || 0,
        })),
        questionCount: (t.subtopics || []).reduce(
          (sum, s) => sum + (countMap[String(s._id)] || 0),
          0
        ),
      }));
    }

    res.json({
      ...subject.toObject(),
      section,
      topics,
      stats: statsFromTopics(all, questionCount),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/topics", async (req, res) => {
  try {
    const { subjectSlug, title, parentId, level, slNo, section, highlighted } =
      req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const subject = await Subject.findOne({ slug: subjectSlug });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    let parent = null;
    if (parentId) {
      parent = await Topic.findById(parentId);
      if (!parent || String(parent.subject) !== String(subject._id)) {
        return res.status(400).json({ message: "Parent topic not found" });
      }
    }

    const topicSection = parent
      ? parent.section
      : SECTIONS.includes(section)
        ? section
        : "theory";

    const count = await Topic.countDocuments({
      subject: subject._id,
      parent: parent ? parent._id : null,
      section: topicSection,
    });

    const parsedSlNo = Number(slNo);
    const nextSlNo =
      Number.isFinite(parsedSlNo) && parsedSlNo > 0 ? parsedSlNo : count + 1;

    const payload = {
      subject: subject._id,
      parent: parent ? parent._id : null,
      section: topicSection,
      title: title.trim(),
      slNo: nextSlNo,
      order: nextSlNo - 1,
    };
    if (!parent) payload.level = level || "medium";
    if (!parent) payload.highlighted = Boolean(highlighted);
    if (req.body.fromNote) payload.fromNote = true;

    const topic = await Topic.create(payload);
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/topics/:id", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const subject = await Subject.findById(topic.subject);

    if (topic.parent) {
      const parentTopic = await Topic.findById(topic.parent);
      const nested = await Topic.find({ parent: topic._id }).sort({
        order: 1,
        createdAt: 1,
      });
      return res.json({
        ...topic.toObject(),
        subject,
        parentTopic,
        nested,
      });
    }

    const all = await Topic.find({ subject: topic.subject }).sort({
      order: 1,
      createdAt: 1,
    });
    const tree = nestTopics(
      all.filter((t) => (t.section || "theory") === (topic.section || "theory"))
    );
    const node = tree.find((item) => String(item._id) === String(topic._id));
    let nested = node?.subtopics || [];
    if (topic.section === "practical" && nested.length) {
      const counts = await Question.aggregate([
        { $match: { topic: { $in: nested.map((s) => s._id) } } },
        { $group: { _id: "$topic", n: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(
        counts.map((c) => [String(c._id), c.n])
      );
      nested = nested.map((s) => ({
        ...s,
        questionCount: countMap[String(s._id)] || 0,
      }));
    }

    res.json({
      ...topic.toObject(),
      subject,
      subtopics: nested,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/topics/:id", async (req, res) => {
  try {
    const allowed = [
      "title",
      "level",
      "slNo",
      "highlighted",
      "notebook",
      "difficulty",
      "inReview",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.slNo !== undefined) {
      updates.slNo = Number(updates.slNo);
      if (!Number.isFinite(updates.slNo) || updates.slNo < 1) {
        delete updates.slNo;
      }
    }
    if (updates.inReview !== undefined) {
      updates.inReview = Boolean(updates.inReview);
    }

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    for (const [key, value] of Object.entries(updates)) {
      topic.set(key, value);
    }
    if (updates.notebook !== undefined) {
      topic.markModified("notebook");
    }

    const saved = await topic.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/topics/:id", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const ids = [];
    async function collect(id) {
      ids.push(id);
      const children = await Topic.find({ parent: id }).select("_id");
      for (const child of children) await collect(child._id);
    }
    await collect(topic._id);
    await Question.deleteMany({ topic: { $in: ids } });
    await Topic.deleteMany({ _id: { $in: ids } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/topics/:id/questions", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    const questions = await Question.find({ topic: topic._id })
      .populate("relatedSection", "title")
      .sort({ order: 1, createdAt: 1 });
    res.json(questions.map(withSolutions));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/topics/:id/questions", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    if (!topic.parent) {
      return res.status(400).json({
        message: "Questions belong on a section under a practical topic",
      });
    }
    const title = req.body.title?.trim();
    if (!title) {
      return res.status(400).json({ message: "Question title is required" });
    }

    let relatedSection = null;
    if (req.body.relatedSectionId) {
      const related = await Topic.findById(req.body.relatedSectionId);
      if (
        related &&
        String(related.parent) === String(topic.parent) &&
        String(related._id) !== String(topic._id)
      ) {
        relatedSection = related._id;
      }
    }

    const solutions = normalizeSolutions(req.body.solutions, req.body);
    const count = await Question.countDocuments({ topic: topic._id });
    const question = await Question.create({
      topic: topic._id,
      title,
      prompt: req.body.prompt || "",
      notes: solutions[0]?.logic || "",
      code: solutions[0]?.code || "",
      language: solutions[0]?.language || "javascript",
      solutions,
      relatedSection,
      difficulty: req.body.difficulty || "medium",
      order: count,
    });
    const populated = await Question.findById(question._id).populate(
      "relatedSection",
      "title"
    );
    res.status(201).json(withSolutions(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate(
      "relatedSection",
      "title"
    );
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(withSolutions(question));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    if (req.body.title !== undefined) {
      const title = req.body.title.trim();
      if (!title) {
        return res.status(400).json({ message: "Question title is required" });
      }
      question.title = title;
    }
    if (req.body.prompt !== undefined) question.prompt = req.body.prompt;
    if (req.body.difficulty !== undefined) {
      question.difficulty = req.body.difficulty;
    }
    if (req.body.solutions !== undefined || req.body.code !== undefined) {
      const solutions = normalizeSolutions(req.body.solutions, {
        code: req.body.code,
        notes: req.body.notes ?? req.body.logic,
        language: req.body.language,
      });
      question.solutions = solutions;
      question.markModified("solutions");
      question.code = solutions[0]?.code || "";
      question.language = solutions[0]?.language || "javascript";
      question.notes = solutions[0]?.logic || "";
    }
    if (req.body.relatedSectionId !== undefined) {
      if (!req.body.relatedSectionId) {
        question.relatedSection = null;
      } else {
        const topic = await Topic.findById(question.topic);
        const related = await Topic.findById(req.body.relatedSectionId);
        if (
          related &&
          topic &&
          String(related.parent) === String(topic.parent) &&
          String(related._id) !== String(topic._id)
        ) {
          question.relatedSection = related._id;
        } else {
          question.relatedSection = null;
        }
      }
    }
    await question.save();
    const populated = await Question.findById(question._id).populate(
      "relatedSection",
      "title"
    );
    res.json(withSolutions(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    await Question.findByIdAndDelete(question._id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
