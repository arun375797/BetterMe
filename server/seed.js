import mongoose from "mongoose";
import dotenv from "dotenv";
import Subject from "./models/Subject.js";
import Topic from "./models/Topic.js";
import Question from "./models/Question.js";
import SugarReading from "./models/SugarReading.js";
import FoodItem from "./models/FoodItem.js";
import MealLog from "./models/MealLog.js";
import ExerciseSession from "./models/ExerciseSession.js";
import VitaminItem from "./models/VitaminItem.js";
import Book from "./models/Book.js";
import BookPage from "./models/BookPage.js";
import PersonalityItem from "./models/PersonalityItem.js";

dotenv.config();

export const SUBJECTS = [
  {
    name: "JavaScript",
    slug: "js",
    shortName: "JS",
    description: "Language basics, DOM, async, and the patterns you use every day.",
    accent: "gold",
    order: 1,
  },
  {
    name: "MongoDB",
    slug: "mongo",
    shortName: "Mongo",
    description: "Collections, queries, relationships, and how data actually lives.",
    accent: "teal",
    order: 2,
  },
  {
    name: "Node.js",
    slug: "node",
    shortName: "Node",
    description: "Server side JavaScript — Express, APIs, auth, and files.",
    accent: "coral",
    order: 3,
  },
  {
    name: "React",
    slug: "react",
    shortName: "React",
    description: "Components, state, routing, and building the screens you actually use.",
    accent: "cyan",
    order: 4,
  },
  {
    name: "DSA",
    slug: "dsa",
    shortName: "DSA",
    description: "Patterns you need for interviews — arrays, strings, recursion, and more.",
    accent: "violet",
    order: 5,
  },
];

export async function ensureSubjects() {
  const existing = await Subject.countDocuments();
  if (existing > 0) return 0;

  await Subject.insertMany(SUBJECTS);
  return SUBJECTS.length;
}

export async function resetUserContent() {
  const results = await Promise.all([
    Topic.deleteMany({}),
    Question.deleteMany({}),
    SugarReading.deleteMany({}),
    FoodItem.deleteMany({}),
    MealLog.deleteMany({}),
    ExerciseSession.deleteMany({}),
    VitaminItem.deleteMany({}),
    Book.deleteMany({}),
    BookPage.deleteMany({}),
    PersonalityItem.deleteMany({}),
  ]);

  return {
    topics: results[0].deletedCount,
    questions: results[1].deletedCount,
    sugar: results[2].deletedCount,
    foods: results[3].deletedCount,
    meals: results[4].deletedCount,
    exercise: results[5].deletedCount,
    vitamins: results[6].deletedCount,
    books: results[7].deletedCount,
    pages: results[8].deletedCount,
    personality: results[9].deletedCount,
  };
}

export async function renamePracticalSolveTitles() {
  const kids = await Topic.find({
    section: "practical",
    parent: { $ne: null },
    title: /^Write \/ solve:/i,
  });
  for (const item of kids) {
    item.title = item.title.replace(/^Write \/ solve:\s*/i, "").trim();
    await item.save();
  }
  return kids.length;
}

export async function ensureTopicSerialNumbers() {
  const missing = await Topic.countDocuments({
    $or: [{ slNo: { $exists: false } }, { slNo: null }, { slNo: { $lte: 0 } }],
  });
  if (!missing) return 0;

  const topics = await Topic.find({});
  const groups = new Map();
  for (const item of topics) {
    const key = `${item.subject}:${item.section || "theory"}:${item.parent || "root"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  let changed = 0;
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        String(a._id).localeCompare(String(b._id))
    );
    const unique = new Set(list.map((item) => Number(item.slNo) || 0));
    const needsFill = unique.has(0) || unique.size < list.length;
    if (!needsFill) continue;
    for (const [index, item] of list.entries()) {
      const next = index + 1;
      if (item.slNo !== next) {
        item.slNo = next;
        item.order = index;
        await item.save();
        changed += 1;
      }
    }
  }
  return changed;
}

const isDirectRun = process.argv[1]?.includes("seed.js");
if (isDirectRun) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => resetUserContent())
    .then((cleared) => {
      console.log("Cleared sample and stored content:", cleared);
      return ensureSubjects();
    })
    .then((count) => {
      if (count) console.log(`Created ${count} empty subject tracks.`);
      else console.log("Subject tracks already exist.");
      return mongoose.disconnect();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
