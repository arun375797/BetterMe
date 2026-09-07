import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";

// Reconciles a subject's practical section against a plan of
// topic -> subtopic -> questions. Safe to re-run: questions are matched by
// title, and anything you have already answered is never overwritten or
// deleted, only reported.

const SECTION = "practical";

function key(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeQuestion(entry, subtopic) {
  const raw = typeof entry === "string" ? { title: entry } : entry;
  return {
    title: raw.title,
    prompt: raw.prompt || "",
    approach: raw.approach || "",
    collectionName: raw.collection || subtopic.collection || "",
    difficulty: raw.difficulty || subtopic.difficulty || "medium",
    // Managed questions are rewritten from the data file on every run.
    // Everything else keeps whatever you typed.
    managed: Boolean(raw.managed),
    solutions: raw.solutions || null,
  };
}

function planSolutions(question) {
  return question.solutions.map((item, index) => ({
    id: `plan-${index + 1}`,
    language: item.language || "javascript",
    code: item.code || "",
    logic: item.logic || "",
  }));
}

function hasAnswer(question) {
  const solutions = Array.isArray(question.solutions) ? question.solutions : [];
  if (
    solutions.some(
      (item) =>
        String(item?.code || "").trim() || String(item?.logic || "").trim()
    )
  ) {
    return true;
  }
  return Boolean(
    String(question.code || "").trim() || String(question.notes || "").trim()
  );
}

export async function seedPracticalTree({ slug, plan, dry = false }) {
  const log = [];
  const note = (line) => log.push(line);

  const subject = await Subject.findOne({ slug }).lean();
  if (!subject) throw new Error(`Subject "${slug}" not found.`);

  async function removeTree(rootId) {
    const ids = [rootId];
    let frontier = [rootId];
    while (frontier.length) {
      const children = await Topic.find({ parent: { $in: frontier } })
        .select("_id")
        .lean();
      frontier = children.map((child) => child._id);
      ids.push(...frontier);
    }
    if (!dry) {
      await Question.deleteMany({ topic: { $in: ids } });
      await Topic.deleteMany({ _id: { $in: ids } });
    }
    return ids.length;
  }

  // parentPending is true in a dry run when the parent itself would still need
  // creating — without it the sibling lookup would leak into the root level.
  async function upsertTopic({ parentId, parentPending, title, slNo, level, difficulty }) {
    const found = parentPending
      ? null
      : (
          await Topic.find({
            subject: subject._id,
            section: SECTION,
            parent: parentId,
          }).lean()
        ).find((item) => key(item.title) === key(title));

    if (found) {
      const updates = { title, slNo, order: slNo - 1 };
      if (level) updates.level = level;
      if (difficulty) updates.difficulty = difficulty;
      if (!dry) await Topic.updateOne({ _id: found._id }, { $set: updates });
      return { id: found._id, created: false };
    }

    if (dry) return { id: null, created: true };

    const doc = await Topic.create({
      subject: subject._id,
      parent: parentId,
      section: SECTION,
      title,
      slNo,
      order: slNo - 1,
      level: level || "medium",
      difficulty: difficulty || "medium",
    });
    return { id: doc._id, created: true };
  }

  async function syncQuestions(topicId, wanted) {
    // No id means a dry run that would have created the topic, so all are new.
    if (!topicId) return { created: wanted.length, kept: 0, removed: 0 };

    const existing = await Question.find({ topic: topicId }).lean();
    const byKey = new Map(existing.map((item) => [key(item.title), item]));
    let created = 0;
    let kept = 0;

    for (const [index, question] of wanted.entries()) {
      const match = byKey.get(key(question.title));
      if (match) {
        kept += 1;
        byKey.delete(key(question.title));
        if (!dry) {
          const updates = {
            title: question.title,
            order: index,
            difficulty: question.difficulty,
            collectionName: question.collectionName,
            // The plan owns the wording of the question and the approach, so
            // edits to the data file reach questions that already exist. Your
            // answers live in solutions/code/notes and are never touched here.
            ...(question.prompt ? { prompt: question.prompt } : {}),
            ...(question.approach ? { approach: question.approach } : {}),
          };
          if (question.managed && question.solutions) {
            const solutions = planSolutions(question);
            updates.solutions = solutions;
            updates.code = solutions[0].code;
            updates.notes = solutions[0].logic;
            updates.language = solutions[0].language;
            updates.prompt = question.prompt;
          }
          await Question.updateOne({ _id: match._id }, { $set: updates });
        }
        continue;
      }
      created += 1;
      if (!dry) {
        const solutions = question.solutions
          ? planSolutions(question)
          : [
              {
                id: `seed-${Date.now()}-${index}`,
                language: "javascript",
                code: "",
                logic: "",
              },
            ];
        await Question.create({
          topic: topicId,
          title: question.title,
          prompt: question.prompt,
          approach: question.approach,
          collectionName: question.collectionName,
          difficulty: question.difficulty,
          order: index,
          solutions,
          code: solutions[0].code,
          notes: solutions[0].logic,
          language: solutions[0].language,
        });
      }
    }

    let removed = 0;
    for (const leftover of byKey.values()) {
      if (hasAnswer(leftover)) {
        note(`  ! kept answered question outside the plan: "${leftover.title}"`);
        continue;
      }
      removed += 1;
      if (!dry) await Question.deleteOne({ _id: leftover._id });
    }

    return { created, kept, removed };
  }

  const totals = { topics: 0, subtopics: 0, questions: 0, created: 0, removed: 0 };
  const wantedMainKeys = new Set(plan.map((item) => key(item.title)));

  for (const [index, main] of plan.entries()) {
    const slNo = index + 1;
    const { id: mainId, created } = await upsertTopic({
      parentId: null,
      title: main.title,
      slNo,
      level: main.level,
    });
    totals.topics += 1;
    note(`${String(slNo).padStart(2, "0")} ${main.title}${created ? "  (new)" : ""}`);

    // Questions live on subtopics, so nothing should sit on the main topic.
    const strays = await syncQuestions(mainId, []);
    totals.removed += strays.removed;

    const wantedSubKeys = new Set(main.subtopics.map((item) => key(item.title)));

    for (const [subIndex, sub] of main.subtopics.entries()) {
      const subResult = await upsertTopic({
        parentId: mainId,
        parentPending: !mainId,
        title: sub.title,
        slNo: subIndex + 1,
        difficulty: sub.difficulty,
      });
      totals.subtopics += 1;

      const questions = sub.questions.map((entry) => normalizeQuestion(entry, sub));
      const stats = await syncQuestions(subResult.id, questions);
      totals.questions += questions.length;
      totals.created += stats.created;
      totals.removed += stats.removed;
      note(
        `   - ${sub.title}: ${questions.length} questions` +
          `${stats.created ? ` (+${stats.created} new)` : ""}` +
          `${stats.removed ? ` (-${stats.removed} stale)` : ""}`
      );
    }

    if (mainId) {
      const extraSubs = await Topic.find({
        subject: subject._id,
        section: SECTION,
        parent: mainId,
      }).lean();
      for (const extra of extraSubs) {
        if (wantedSubKeys.has(key(extra.title))) continue;
        const answered = await Question.find({ topic: extra._id }).lean();
        if (answered.some(hasAnswer)) {
          note(`   ! kept extra subtopic with answers: "${extra.title}"`);
          continue;
        }
        await removeTree(extra._id);
        note(`   - removed extra subtopic "${extra.title}"`);
      }
    }
  }

  const extraMains = await Topic.find({
    subject: subject._id,
    section: SECTION,
    parent: null,
  }).lean();
  for (const extra of extraMains) {
    if (wantedMainKeys.has(key(extra.title))) continue;
    const descendants = await Topic.find({ parent: extra._id }).select("_id").lean();
    const questions = await Question.find({
      topic: { $in: [extra._id, ...descendants.map((d) => d._id)] },
    }).lean();
    if (questions.some(hasAnswer)) {
      note(`!! kept old topic "${extra.title}" because it has answers`);
      continue;
    }
    await removeTree(extra._id);
    note(`-- removed old topic "${extra.title}"`);
  }

  return { log, totals };
}

export async function runPracticalSeed({ slug, plan, before }) {
  const dry = process.argv.includes("--dry");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
  if (before) await before();

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const { log, totals } = await seedPracticalTree({ slug, plan, dry });
    console.log(log.join("\n"));
    console.log(
      `\n${dry ? "[dry run] " : ""}${totals.topics} topics, ${totals.subtopics} subtopics, ` +
        `${totals.questions} questions in the plan ` +
        `(+${totals.created} created, -${totals.removed} stale removed)`
    );
  } finally {
    await mongoose.disconnect();
  }
}
