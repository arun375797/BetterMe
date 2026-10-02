import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const dry = process.argv.includes("--dry");
const SECTION = "practical";

const ROOT_PLAN = [
  { title: "Basic", reuse: ["Basic"] },
  { title: "Numbers / Math", reuse: [] },
  { title: "Arrays", reuse: ["move"] },
  { title: "Strings", reuse: ["String"] },
  { title: "Array Manipulation", reuse: ["delete"] },
  { title: "Objects", reuse: ["Object"] },
  { title: "Higher-Order Methods", reuse: ["Reduce"] },
  { title: "Functions", reuse: [] },
  { title: "Async JavaScript", reuse: ["Promise"] },
  { title: "Classes / OOP", reuse: ["Class"] },
  { title: "Prototype", reuse: ["Proto Type - add properquestions"] },
  { title: "DOM", reuse: ["Dom"] },
  { title: "Advanced Problems", reuse: ["Hard"] },
];

const BASIC_ARRAYS = new Set([
  "return nth elem of array",
  "array contain specific elements",
  "elements common in two arrays",
  "largest",
  "samllest",
  "second largest",
  "seacond samllest",
  "search two elements in an array",
  "swap two elem in array",
]);

const BASIC_STRINGS = new Set([
  "count occurrence of string",
  "find extra characters/ duplicate",
  "unique characters from string",
]);

const BASIC_NUMBERS = new Set([
  "even number sum",
  "even or odd",
  "greatest common divisor of two number",
]);

const BASIC_SIMPLE = new Set(["max of two numbe", "min"]);

const BASIC_ARRAY_MANIPULATION = new Set([
  "sort array ascending",
  "merge two array and remove duplicate",
  "move all the zeros in an array to the front",
  "move all the zeros in an array to the right",
]);

const BASIC_ADVANCED = new Set([
  "missing number of array 1 to n",
  "second highest element and second least element from a non-sorted array",
  "second highest and least",
  "max count of consecutive 1's in an array",
  "flatten nested array",
]);

const TITLE_FIXES = new Map([
  ["samllest", "Find the smallest element in an array"],
  ["seacond samllest", "Find the second-smallest element in an array"],
  ["greatest common divisor of two number", "Find the greatest common divisor of two numbers"],
  ["max of two numbe", "Find the maximum of two numbers"],
  ["min", "Find the minimum of two numbers"],
  ["second highest element and second least element from a non-sorted array", "Find the second-highest and second-lowest elements in an unsorted array"],
  ["second highest and least", "Find the second-highest and second-lowest elements in an unsorted array"],
  ["prime remove", "Remove prime numbers from an array"],
  ["whiite space remove", "Remove whitespace from a string"],
  ["reduce(): sum of positive numbers", "Use reduce() to sum positive numbers"],
  ["reduce: sum of positive numbers", "Use reduce() to sum positive numbers"],
  ["pallindrome", "Check whether a value is a palindrome"],
  ["avverage of prome", "Find the average of prime numbers"],
  ["saync await code", "Write an async/await example"],
  ["promise code", "Write a Promise example"],
  ["settime out", "Use setTimeout()"],
  ["set interval", "Use setInterval()"],
  ["call,apply,bind", "Demonstrate call(), apply(), and bind()"],
  ["freequency", "Build a frequency counter object"],
  ["nherit methods from a parent class", "Inherit methods from a parent class"],
  ["what is method over riding", "Demonstrate method overriding"],
]);

const PROTOTYPE_QUESTIONS = [
  "Create an object with a constructor function and add a shared method to its prototype",
  "Demonstrate the prototype chain from an instance to Object.prototype",
  "Add a new method to an existing constructor's prototype",
  "Override an inherited prototype method on a child object",
  "Use Object.create() to create an object with a specified prototype",
  "Implement prototypal inheritance between two constructor functions",
  "Check whether a property is owned or inherited",
  "Compare prototype and __proto__ using a practical example",
];

const DOM_QUESTIONS = [
  "Select an element and update its text content",
  "Create an element and append it to the document",
  "Toggle a CSS class when a button is clicked",
  "Add and remove an event listener",
  "Implement event delegation for a list of items",
  "Read and validate values from a form submission",
  "Render a list of items from an array",
  "Remove an element from the DOM",
  "Read and update data attributes on an element",
  "Debounce a search input event",
];

function key(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hasAnswer(question) {
  return (
    (question.solutions || []).some(
      (item) =>
        String(item?.code || "").trim() ||
        String(item?.output || "").trim() ||
        String(item?.logic || "").trim()
    ) ||
    Boolean(String(question.code || "").trim()) ||
    Boolean(String(question.notes || "").trim())
  );
}

function rootDestination(topicTitle, questionTitle) {
  const topic = key(topicTitle);
  const title = key(questionTitle);

  if (topic === "basic") {
    if (BASIC_ARRAYS.has(title)) return "Arrays";
    if (BASIC_STRINGS.has(title)) return "Strings";
    if (BASIC_NUMBERS.has(title)) return "Numbers / Math";
    if (BASIC_SIMPLE.has(title)) return "Basic";
    if (BASIC_ARRAY_MANIPULATION.has(title)) return "Array Manipulation";
    if (BASIC_ADVANCED.has(title)) return "Advanced Problems";
    if (title === "freequency") return "Objects";
  }
  const alreadyOrganized = ROOT_PLAN.find((item) => key(item.title) === topic);
  if (alreadyOrganized) return alreadyOrganized.title;
  if (topic === "string") {
    return title === "longest sequence of consecutive character (repeat character)"
      ? "Advanced Problems"
      : "Strings";
  }
  if (topic === "delete") return "Array Manipulation";
  if (topic === "reverse") {
    return title === "reverse string" ? "Strings" : "Array Manipulation";
  }
  if (topic === "reduce") return "Higher-Order Methods";
  if (topic === "object array") return "Objects";
  if (topic === "object") {
    return title === "call,apply,bind" ? "Functions" : "Objects";
  }
  if (topic === "hard") {
    if (title.includes("generator function")) return "Functions";
    if (title === "prime remove") return "Array Manipulation";
    if (title === "pallindrome") return "Strings";
    return "Numbers / Math";
  }
  if (topic === "promise") {
    return title === "iife" ? "Functions" : "Async JavaScript";
  }
  throw new Error(`No destination for question "${questionTitle}" from "${topicTitle}".`);
}

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
  await mongoose.connect(process.env.MONGODB_URI);
  const session = await mongoose.startSession();
  const lines = [];

  try {
    await session.withTransaction(async () => {
      const subject = await Subject.findOne({ slug: "js" }).session(session);
      if (!subject) throw new Error('Subject "js" was not found.');

      const existingRoots = await Topic.find({
        subject: subject._id,
        section: SECTION,
        parent: null,
      })
        .sort({ slNo: 1, order: 1 })
        .session(session);
      const originalRootTitles = new Map(
        existingRoots.map((item) => [String(item._id), item.title])
      );

      const roots = new Map();
      const claimed = new Set();
      for (const [index, planned] of ROOT_PLAN.entries()) {
        const aliases = [planned.title, ...planned.reuse].map(key);
        let topic = existingRoots.find(
          (item) => !claimed.has(String(item._id)) && aliases.includes(key(item.title))
        );
        if (!topic) {
          topic = new Topic({
            subject: subject._id,
            section: SECTION,
            parent: null,
            title: planned.title,
          });
          lines.push(`+ topic: ${planned.title}`);
        }
        claimed.add(String(topic._id));
        topic.title = planned.title;
        topic.slNo = index + 1;
        topic.order = index;
        if (!dry) await topic.save({ session });
        roots.set(planned.title, topic);
      }

      const classRoot = roots.get("Classes / OOP");
      const classChildren = await Topic.find({ parent: classRoot._id })
        .sort({ slNo: 1, order: 1 })
        .session(session);
      const classPlan = [
        "Creating Classes and Objects",
        "Inheritance",
        "Method Overriding",
        "Encapsulation",
        "Abstraction",
        "Static Members",
        "Polymorphism",
      ];
      const classAliases = new Map([
        ["Static Members", ["Static Properties and Static Methods"]],
      ]);
      const classTargets = new Map();
      const claimedClassChildren = new Set();

      for (const [index, title] of classPlan.entries()) {
        const aliases = [title, ...(classAliases.get(title) || [])].map(key);
        const topic = classChildren.find(
          (item) =>
            !claimedClassChildren.has(String(item._id)) && aliases.includes(key(item.title))
        );
        if (!topic) throw new Error(`Expected class subtopic "${title}" was not found.`);
        claimedClassChildren.add(String(topic._id));
        topic.title = title;
        topic.slNo = index + 1;
        topic.order = index;
        if (!dry) await topic.save({ session });
        classTargets.set(title, topic);
      }

      const allTopics = await Topic.find({ subject: subject._id, section: SECTION })
        .session(session);
      const topicById = new Map(allTopics.map((item) => [String(item._id), item]));
      const allQuestions = await Question.find()
        .where("topic")
        .in(allTopics.map((item) => item._id))
        .sort({ createdAt: 1 })
        .session(session);

      const moves = [];
      for (const question of allQuestions) {
        const source = topicById.get(String(question.topic));
        const parent = source?.parent
          ? topicById.get(String(source.parent))
          : null;
        let destination;
        if (parent && String(parent._id) === String(classRoot._id)) {
          destination = classTargets.get(
            key(source.title) === "static properties and static methods"
              ? "Static Members"
              : source.title
          );
          if (key(source.title) === "method overriding") {
            destination = classTargets.get("Method Overriding");
          }
        } else if (!parent && String(source._id) === String(classRoot._id)) {
          destination = classTargets.get("Creating Classes and Objects");
        } else if (!parent) {
          destination = roots.get(
            rootDestination(
              originalRootTitles.get(String(source._id)) || source.title,
              question.title
            )
          );
        }
        if (!destination) {
          throw new Error(`No destination topic for "${question.title}".`);
        }
        const correctedTitle = TITLE_FIXES.get(key(question.title)) || question.title.trim();
        moves.push({ question, destination, correctedTitle });
      }

      // De-duplicate only when the discarded copy has no saved solution.
      const winners = new Map();
      const duplicates = [];
      for (const move of moves) {
        const duplicateKey = `${move.destination._id}:${key(move.correctedTitle)}`;
        const current = winners.get(duplicateKey);
        if (!current) {
          winners.set(duplicateKey, move);
          continue;
        }
        if (hasAnswer(current.question) && hasAnswer(move.question)) {
          throw new Error(`Both duplicates contain answers: "${move.correctedTitle}".`);
        }
        if (hasAnswer(move.question)) {
          duplicates.push(current);
          winners.set(duplicateKey, move);
        } else {
          duplicates.push(move);
        }
      }

      const orderByTopic = new Map();
      for (const move of winners.values()) {
        const destinationId = String(move.destination._id);
        const order = orderByTopic.get(destinationId) || 0;
        move.question.topic = move.destination._id;
        move.question.title = move.correctedTitle;
        move.question.order = order;
        orderByTopic.set(destinationId, order + 1);
        if (!dry) await move.question.save({ session });
      }
      for (const move of duplicates) {
        if (hasAnswer(move.question)) {
          throw new Error(`Refusing to remove answered duplicate "${move.question.title}".`);
        }
        lines.push(`- duplicate: ${move.correctedTitle}`);
        if (!dry) await Question.deleteOne({ _id: move.question._id }).session(session);
      }

      async function addQuestions(topic, titles) {
        const existing = await Question.find({ topic: topic._id }).session(session);
        const existingKeys = new Set(existing.map((item) => key(item.title)));
        let order = existing.length;
        for (const title of titles) {
          if (existingKeys.has(key(title))) continue;
          lines.push(`+ question (${topic.title}): ${title}`);
          if (!dry) {
            await Question.create(
              [
                {
                  topic: topic._id,
                  title,
                  difficulty: "medium",
                  order,
                  solutions: [
                    {
                      id: `reorg-${Date.now()}-${order}`,
                      language: "javascript",
                      code: "",
                      logic: "",
                    },
                  ],
                },
              ],
              { session }
            );
          }
          order += 1;
        }
      }

      await addQuestions(roots.get("Prototype"), PROTOTYPE_QUESTIONS);
      await addQuestions(roots.get("DOM"), DOM_QUESTIONS);

      const retainedTopicIds = new Set([
        ...[...roots.values()].map((item) => String(item._id)),
        ...[...classTargets.values()].map((item) => String(item._id)),
      ]);
      for (const topic of allTopics) {
        if (retainedTopicIds.has(String(topic._id))) continue;
        const questionCount = dry
          ? [...winners.values()].filter(
              (move) => String(move.destination._id) === String(topic._id)
            ).length
          : await Question.countDocuments({ topic: topic._id }).session(session);
        const childCount = dry
          ? allTopics.filter(
              (item) =>
                String(item.parent) === String(topic._id) &&
                retainedTopicIds.has(String(item._id))
            ).length
          : await Topic.countDocuments({ parent: topic._id }).session(session);
        if (questionCount || childCount) {
          throw new Error(`Cannot remove non-empty old topic "${topic.title}".`);
        }
        lines.push(`- old topic: ${topic.title}`);
        if (!dry) await Topic.deleteOne({ _id: topic._id }).session(session);
      }

      if (dry) await session.abortTransaction();
    });

    console.log(lines.join("\n"));
    console.log(`\n${dry ? "[dry run] " : ""}JavaScript practical reorganization complete.`);
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
