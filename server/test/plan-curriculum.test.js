import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { subjectCurriculum } from "../lib/curriculum.js";
import router from "../routes/plan.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import PlanItem from "../models/PlanItem.js";

const subjects = [{ _id: "dsa", slug: "dsa", name: "DSA" }, { _id: "mongo", slug: "mongo", name: "MongoDB" }];
const topics = [
  { _id: "strings", subject: "dsa", section: "practical", title: "Strings", slNo: 2 },
  { _id: "arrays", subject: "dsa", section: "practical", title: "Arrays", slNo: 1 },
  { _id: "sorting", subject: "dsa", section: "practical", title: "Sorting", parent: "arrays" },
  { _id: "bubble", subject: "dsa", section: "practical", title: "Bubble sort", parent: "sorting" },
  { _id: "complexity", subject: "dsa", title: "Complexity" },
  { _id: "note", subject: "dsa", title: "Notebook section", parent: "complexity", fromNote: true },
  { _id: "queries", subject: "mongo", section: "practical", title: "Queries" },
];
const counts = [{ _id: "arrays", n: 1 }, { _id: "sorting", n: 2 }, { _id: "bubble", n: 3 }, { _id: "queries", n: 7 }];

test("curriculum preserves subject, section, nested topics and rolled-up question counts", () => {
  const [theory, practical] = subjectCurriculum("dsa", topics, counts);
  assert.equal(theory.mainTopics, 1);
  assert.equal(theory.subtopics, 0);
  assert.equal(practical.mainTopics, 2);
  assert.equal(practical.subtopics, 2);
  assert.equal(practical.questions, 6);
  assert.deepEqual(practical.topics.map((row) => row.title), ["Arrays", "Strings"]);
  assert.equal(practical.topics[0].totalQuestions, 6);
  assert.equal(practical.topics[0].children[0].children[0].title, "Bubble sort");
  assert.equal(subjectCurriculum("mongo", topics, counts)[1].questions, 7);
  assert.equal(subjectCurriculum("empty", topics, counts)[1].mainTopics, 0);
});

test("overview and subject plan expose the same learning content independently of scheduled entries", async () => {
  const originals = [Subject.find, Subject.findOne, Topic.find, Question.aggregate, PlanItem.find];
  const items = [{ _id: "scheduled", subject: subjects[0], title: "test", date: "2026-10-14" }];
  Subject.find = () => ({ sort: () => ({ lean: async () => subjects }) });
  Subject.findOne = ({ slug }) => ({ lean: async () => subjects.find((row) => row.slug === slug) });
  Topic.find = () => ({ select: () => ({ lean: async () => topics }) });
  Question.aggregate = async () => counts;
  PlanItem.find = () => ({ populate: () => ({ lean: async () => items }), lean: async () => items });
  const app = express();
  app.use("/api/plan", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/plan`;
  try {
    const overview = await (await fetch(url)).json();
    assert.equal(overview.subjects[0].total, 1);
    assert.equal(overview.subjects[0].curriculum[1].mainTopics, 2);
    assert.equal(overview.subjects[1].total, 0);
    assert.equal(overview.subjects[1].curriculum[1].mainTopics, 1);
    const detail = await (await fetch(`${url}/subject/dsa`)).json();
    assert.deepEqual(detail.card.curriculum, overview.subjects[0].curriculum);
    assert.equal(detail.items[0].title, "test");
    assert.equal((await fetch(`${url}/subject/missing`)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    [Subject.find, Subject.findOne, Topic.find, Question.aggregate, PlanItem.find] = originals;
  }
});
