import { Router } from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import { memoClear, memoGet } from "../memo.js";

const router = Router();
const SECTIONS = ["theory", "practical"];
const LIST_SELECT = "-notebook";

function cleanUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return { url: "" };

  let text = raw;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(text)) {
    text = `https://${text}`;
  }
  try {
    const parsed = new URL(text);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { error: "Video link must start with http or https." };
    }
    return { url: parsed.toString() };
  } catch {
    return { error: "Video link must be a valid URL." };
  }
}

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

function idKey(value) {
  if (value == null || value === "") return "root";
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id != null) return idKey(value._id);
    if (value.$oid) return String(value.$oid);
  }
  return String(value);
}

function titleKey(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueByTitle(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = titleKey(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function deleteTopicTree(rootId) {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length) {
    const children = await Topic.find({ parent: { $in: frontier } })
      .select("_id")
      .lean();
    frontier = children.map((child) => child._id);
    ids.push(...frontier);
  }
  await Question.deleteMany({ topic: { $in: ids } });
  await Topic.deleteMany({ _id: { $in: ids } });
  return ids;
}

function nestTopics(topics) {
  const objs = topics.map((t) => (t.toObject ? t.toObject() : { ...t }));
  const byParent = new Map();
  for (const item of objs) {
    const key = item.parent ? idKey(item.parent) : "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }

  function listChildren(id) {
    const key = id == null || id === "root" ? "root" : idKey(id);
    return (byParent.get(key) || []).sort(
      (a, b) => (a.slNo ?? a.order ?? 0) - (b.slNo ?? b.order ?? 0)
    );
  }

  const mains = (byParent.get("root") || []).sort((a, b) => {
    const star =
      Number(Boolean(b.highlighted)) - Number(Boolean(a.highlighted));
    if (star !== 0) return star;
    return (a.slNo ?? a.order) - (b.slNo ?? b.order);
  });

  return mains.map((main) => ({
    ...main,
    subtopics: listChildren(main._id)
      .filter((child) => !child.fromNote)
      .map((child) => ({
        ...child,
        nested: uniqueByTitle(listChildren(child._id)),
      })),
  }));
}

function statsFromTopics(topics, questionCount = 0) {
  const bySection = {};
  for (const section of SECTIONS) {
    const inSection = topics.filter((t) => (t.section || "theory") === section);
    const mains = inSection.filter((t) => !t.parent);
    const children = inSection.filter((t) => t.parent && !t.fromNote);
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
    const payload = await memoGet("learning:review", 20_000, async () => {
      const items = await Topic.find({
        inReview: true,
        parent: { $ne: null },
      })
        .select(LIST_SELECT)
        .populate("subject", "name slug shortName accent")
        .populate("parent", "title")
        .sort({ updatedAt: -1 })
        .lean();

      const rank = { hard: 0, ec: 1, medium: 2, easy: 3 };
      items.sort(
        (a, b) =>
          (rank[a.difficulty] ?? 2) - (rank[b.difficulty] ?? 2) ||
          new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      return items.map((item) => ({
        ...item,
        parentTopic: item.parent,
        parent: item.parent?._id || item.parent,
      }));
    });
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/subjects", async (_req, res) => {
  try {
    const payload = await memoGet("learning:subjects", 20_000, async () => {
      const [subjects, topics, questionCounts] = await Promise.all([
        Subject.find().sort({ order: 1 }).lean(),
        Topic.find().select("subject parent section fromNote inReview").lean(),
        Question.aggregate([{ $group: { _id: "$topic", n: { $sum: 1 } } }]),
      ]);
      const topicById = Object.fromEntries(
        topics.map((topic) => [String(topic._id), topic])
      );
      const questionsBySubject = {};
      for (const row of questionCounts) {
        const topic = topicById[String(row._id)];
        if (!topic) continue;
        const sid = String(topic.subject);
        questionsBySubject[sid] = (questionsBySubject[sid] || 0) + row.n;
      }

      return subjects.map((subject) => {
        const subjectTopics = topics.filter(
          (topic) => String(topic.subject) === String(subject._id)
        );
        return {
          ...subject,
          stats: statsFromTopics(
            subjectTopics,
            questionsBySubject[String(subject._id)] || 0
          ),
        };
      });
    });
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/subjects/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const section = SECTIONS.includes(req.query.section)
      ? req.query.section
      : null;
    const payload = await memoGet(
      `learning:subject:${slug}:${section || "all"}`,
      15_000,
      async () => {
        const subject = await Subject.findOne({ slug }).lean();
        if (!subject) return null;

        const all = await Topic.find({ subject: subject._id })
          .select(LIST_SELECT)
          .sort({ slNo: 1, order: 1, createdAt: 1 })
          .lean();
        const questionCount = await Question.countDocuments({
          topic: { $in: all.map((topic) => topic._id) },
        });

        const scoped = section
          ? all.filter((topic) => (topic.section || "theory") === section)
          : [];

        let topics = section ? nestTopics(scoped) : [];
        if (section === "practical" && topics.length) {
          const childIds = topics.flatMap((topic) =>
            (topic.subtopics || []).map((sub) => sub._id)
          );
          let countMap = {};
          if (childIds.length) {
            const counts = await Question.aggregate([
              { $match: { topic: { $in: childIds } } },
              { $group: { _id: "$topic", n: { $sum: 1 } } },
            ]);
            countMap = Object.fromEntries(
              counts.map((row) => [String(row._id), row.n])
            );
          }
          topics = topics.map((topic) => ({
            ...topic,
            subtopics: (topic.subtopics || []).map((sub) => ({
              ...sub,
              questionCount: countMap[String(sub._id)] || 0,
            })),
            questionCount: (topic.subtopics || []).reduce(
              (sum, sub) => sum + (countMap[String(sub._id)] || 0),
              0
            ),
          }));
        }

        return {
          ...subject,
          section,
          topics,
          stats: statsFromTopics(all, questionCount),
        };
      }
    );
    if (!payload) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(payload);
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

    if (req.body.fromNote && parent) {
      const key = titleKey(title);
      const siblings = await Topic.find({ parent: parent._id });
      const matches = siblings.filter((item) => titleKey(item.title) === key);
      if (matches.length) {
        const removedIds = [];
        for (const item of matches) {
          const ids = await deleteTopicTree(item._id);
          removedIds.push(...ids.map((id) => String(id)));
        }
        memoClear("learning");
        return res.json({
          removed: true,
          title: matches[0].title,
          ids: removedIds,
        });
      }
    }

    const topic = await Topic.create(payload);
    memoClear("learning");
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/topics/:id", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).lean();
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const subject = await Subject.findById(topic.subject).lean();

    if (topic.parent) {
      const [parentTopic, nested, siblings] = await Promise.all([
        Topic.findById(topic.parent).select(LIST_SELECT).lean(),
        Topic.find({ parent: topic._id })
          .select(LIST_SELECT)
          .sort({ order: 1, createdAt: 1 })
          .lean(),
        Topic.find({
          parent: topic.parent,
          fromNote: { $ne: true },
        })
          .select(LIST_SELECT)
          .sort({ slNo: 1, order: 1, createdAt: 1 })
          .lean(),
      ]);
      return res.json({
        ...topic,
        subject,
        parentTopic: parentTopic
          ? { ...parentTopic, subtopics: siblings }
          : null,
        nested: uniqueByTitle(nested),
      });
    }

    const subtopics = await Topic.find({
      parent: topic._id,
      fromNote: { $ne: true },
    })
      .select(LIST_SELECT)
      .sort({ slNo: 1, order: 1, createdAt: 1 })
      .lean();
    const subIds = subtopics.map((item) => item._id);
    const fromNotes = subIds.length
      ? await Topic.find({ parent: { $in: subIds } })
          .select(LIST_SELECT)
          .sort({ order: 1, createdAt: 1 })
          .lean()
      : [];
    const notesByParent = new Map();
    for (const note of fromNotes) {
      const key = idKey(note.parent);
      if (!notesByParent.has(key)) notesByParent.set(key, []);
      notesByParent.get(key).push(note);
    }

    let nested = subtopics.map((item) => ({
      ...item,
      nested: uniqueByTitle(notesByParent.get(idKey(item._id)) || []),
    }));
    if (topic.section === "practical" && nested.length) {
      const counts = await Question.aggregate([
        { $match: { topic: { $in: nested.map((sub) => sub._id) } } },
        { $group: { _id: "$topic", n: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(
        counts.map((row) => [String(row._id), row.n])
      );
      nested = nested.map((sub) => ({
        ...sub,
        questionCount: countMap[String(sub._id)] || 0,
      }));
    }

    res.json({
      ...topic,
      notebook: undefined,
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
      "youtubeUrl",
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
    if (updates.youtubeUrl !== undefined) {
      const cleaned = cleanUrl(updates.youtubeUrl);
      if (cleaned.error) {
        return res.status(400).json({ message: cleaned.error });
      }
      updates.youtubeUrl = cleaned.url;
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
    memoClear("learning");
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

    await deleteTopicTree(topic._id);
    memoClear("learning");
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
      .select("title difficulty order relatedSection createdAt")
      .populate("relatedSection", "title")
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json(questions);
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
    memoClear("learning");
    res.status(201).json(withSolutions(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("relatedSection", "title")
      .lean();
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
    memoClear("learning");
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
    memoClear("learning");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
