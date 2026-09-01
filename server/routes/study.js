import { Router } from "express";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import StudySettings from "../models/StudySettings.js";
import StudyLog from "../models/StudyLog.js";

const router = Router();
const KINDS = ["theory", "practical", "review"];
const STATUSES = ["done", "skipped"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let indexesReady = false;

async function ensureLogIndexes() {
  if (indexesReady) return;
  try {
    await StudyLog.collection.dropIndex("day_1_kind_1");
  } catch {
    /* old unique index may already be gone */
  }
  indexesReady = true;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dayKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDay(value) {
  const key = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const d = new Date(`${key}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function mondayOf(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const weekday = d.getDay();
  d.setDate(d.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return d;
}

function daysBetween(fromKey, toKey) {
  const a = parseDay(fromKey);
  const b = parseDay(toKey);
  if (!a || !b) return null;
  return Math.round((b - a) / 86_400_000);
}

function clampSlots(value) {
  const n = Number(value);
  if (n === 3) return 3;
  return 2;
}

function idList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item?._id || item || "")).filter(Boolean);
}

function emptyRotation() {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    subjects: [],
  }));
}

function migrateRow(row) {
  const weekday = Number(row?.weekday);
  if (Array.isArray(row?.subjects) && row.subjects.length) {
    return { weekday, subjects: idList(row.subjects) };
  }
  if (row?.subject) {
    return { weekday, subjects: [String(row.subject)] };
  }
  return { weekday, subjects: [] };
}

function rotationFor(settings, weekday) {
  return (
    settings.rotation.find((row) => Number(row.weekday) === weekday) || {
      weekday,
      subjects: [],
    }
  );
}

function focusKey(subjectId, kind) {
  return `${subjectId}:${kind}`;
}

function logKey(kind, subjectId) {
  return `${kind}:${subjectId || "none"}`;
}

async function getSettings() {
  let settings = await StudySettings.findOne();
  if (!settings) {
    settings = await StudySettings.create({
      slotsPerDay: 2,
      rotation: emptyRotation(),
      focus: {},
    });
    return settings;
  }

  const slotsPerDay = clampSlots(settings.slotsPerDay || 2);
  const byWeekday = Object.fromEntries(
    (settings.rotation || []).map((row) => [Number(row.weekday), migrateRow(row)])
  );
  const rotation = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const row = byWeekday[weekday] || { weekday, subjects: [] };
    return {
      weekday,
      subjects: row.subjects.slice(0, slotsPerDay),
    };
  });

  const same =
    settings.slotsPerDay === slotsPerDay &&
    JSON.stringify(
      (settings.rotation || []).map((row) => ({
        weekday: Number(row.weekday),
        subjects: idList(row.subjects),
      }))
    ) === JSON.stringify(rotation);

  if (!same) {
    settings.slotsPerDay = slotsPerDay;
    settings.rotation = rotation;
    await settings.save();
  }
  return settings;
}

function sanitizeSubjects(raw, validIds, slotsPerDay) {
  const seen = new Set();
  const out = [];
  for (const item of idList(raw)) {
    if (!validIds.has(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= slotsPerDay) break;
  }
  return out;
}

async function lastDoneBySubject() {
  const logs = await StudyLog.find({ status: "done", subject: { $ne: null } })
    .sort({ day: -1 })
    .select("subject day")
    .lean();
  const map = {};
  for (const log of logs) {
    const sid = String(log.subject);
    if (!map[sid]) map[sid] = log.day;
  }
  return map;
}

async function mainTopics(subjectId, section) {
  return Topic.find({
    subject: subjectId,
    section,
    parent: null,
  })
    .select("title slNo order section")
    .sort({ slNo: 1, order: 1, createdAt: 1 })
    .lean();
}

async function topicFor(settings, subject, kind) {
  if (!subject) return null;
  const mains = await mainTopics(subject._id, kind);
  if (!mains.length) return null;
  const stored = settings.focus?.[focusKey(subject._id, kind)];
  return mains.find((item) => String(item._id) === String(stored)) || mains[0];
}

function topicHref(subject, topic, kind) {
  if (!subject?.slug) return "/learning";
  if (!topic?._id) return `/learning/${subject.slug}/${kind}`;
  return `/learning/${subject.slug}/${kind}/${topic._id}`;
}

function slimSubject(subject) {
  if (!subject) return null;
  return {
    _id: subject._id,
    name: subject.name,
    slug: subject.slug,
    shortName: subject.shortName,
    accent: subject.accent,
  };
}

function slimTopic(topic) {
  if (!topic) return null;
  return {
    _id: topic._id,
    title: topic.title,
    slNo: topic.slNo,
    parentTitle: topic.parentTitle || null,
  };
}

function sessionSnap(log, topicById) {
  if (!log) return { status: "open", topic: null };
  const topic = log.topic ? topicById[String(log.topic)] : null;
  return {
    status: log.status || "open",
    topic: topic ? { _id: topic._id, title: topic.title, slNo: topic.slNo } : null,
  };
}

function buildJournal({ settings, subjects, logs, topicById, fromKey, toKey }) {
  const byId = Object.fromEntries(subjects.map((s) => [String(s._id), s]));
  const byDay = {};
  for (const log of logs) {
    if (log.day < fromKey || log.day > toKey) continue;
    if (!byDay[log.day]) byDay[log.day] = [];
    byDay[log.day].push(log);
  }

  const days = [];
  const cursor = parseDay(toKey) || new Date();
  cursor.setHours(12, 0, 0, 0);
  const start = parseDay(fromKey);
  while (start && cursor >= start) {
    const key = dayKey(cursor);
    const weekday = cursor.getDay();
    const lineup = idList(rotationFor(settings, weekday).subjects);
    const dayLogs = byDay[key] || [];
    if (lineup.length || dayLogs.length) {
      const extra = dayLogs
        .map((log) => (log.subject ? String(log.subject) : ""))
        .filter(Boolean);
      const ids = [...new Set([...lineup, ...extra])];
      const groups = ids
        .map((sid) => {
          const subject = byId[sid];
          if (!subject) return null;
          const theory = dayLogs.find(
            (log) => log.kind === "theory" && String(log.subject) === sid
          );
          const practical = dayLogs.find(
            (log) => log.kind === "practical" && String(log.subject) === sid
          );
          return {
            subject: slimSubject(subject),
            theory: sessionSnap(theory, topicById),
            practical: sessionSnap(practical, topicById),
          };
        })
        .filter(Boolean);
      const complete =
        lineup.length > 0 &&
        lineup.every((sid) => {
          const theory = dayLogs.find(
            (log) => log.kind === "theory" && String(log.subject) === sid
          );
          const practical = dayLogs.find(
            (log) =>
              log.kind === "practical" && String(log.subject) === sid
          );
          return theory?.status === "done" && practical?.status === "done";
        });
      days.push({
        key,
        weekday,
        weekdayLabel: WEEKDAYS[weekday],
        complete,
        groups,
      });
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const bySubject = subjects.map((subject) => {
    const sid = String(subject._id);
    const mine = logs.filter(
      (log) =>
        String(log.subject) === sid &&
        log.day >= fromKey &&
        log.day <= toKey
    );
    const done = mine.filter((log) => log.status === "done");
    const last = done.reduce((best, log) => (log.day > best ? log.day : best), "");
    const newest = (kind) =>
      done
        .filter((log) => log.kind === kind)
        .sort((a, b) => b.day.localeCompare(a.day))[0];
    return {
      ...slimSubject(subject),
      theory: done.filter((log) => log.kind === "theory").length,
      practical: done.filter((log) => log.kind === "practical").length,
      lastDone: last || null,
      lastTheory: sessionSnap(newest("theory"), topicById).topic,
      lastPractical: sessionSnap(newest("practical"), topicById).topic,
    };
  });

  return { days, bySubject };
}

function sessionBlock({ id, kind, label, status, subject, topic, href }) {
  return {
    id,
    kind,
    label,
    status: status || "open",
    subject: slimSubject(subject),
    topic: slimTopic(topic),
    href,
  };
}

function dayComplete(blocks) {
  return blocks.length > 0 && blocks.every((block) => block.status === "done");
}

async function blocksForDay(settings, date, subjects, logsByDay) {
  const key = dayKey(date);
  const weekday = date.getDay();
  const slot = rotationFor(settings, weekday);
  const byId = Object.fromEntries(subjects.map((s) => [String(s._id), s]));
  const lineup = idList(slot.subjects)
    .map((id) => byId[id])
    .filter(Boolean);
  const dayLogs = logsByDay[key] || {};
  const blocks = [];

  for (const subject of lineup) {
    for (const kind of ["theory", "practical"]) {
      const topic = await topicFor(settings, subject, kind);
      const log = dayLogs[logKey(kind, subject._id)];
      blocks.push(
        sessionBlock({
          id: `${kind}-${subject._id}`,
          kind,
          label: kind === "theory" ? "Theory" : "Practical",
          status: log?.status,
          subject,
          topic,
          href: topicHref(subject, topic, kind),
        })
      );
    }
  }

  return {
    key,
    weekday,
    weekdayLabel: WEEKDAYS[weekday],
    lineup: lineup.map(slimSubject),
    complete: dayComplete(blocks),
    blocks,
  };
}

function computeStreak(settings, subjects, logsByDay, today) {
  const byId = Object.fromEntries(subjects.map((s) => [String(s._id), s]));
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    const date = addDays(today, -i);
    date.setHours(12, 0, 0, 0);
    const key = dayKey(date);
    const lineup = idList(rotationFor(settings, date.getDay()).subjects).filter(
      (id) => byId[id]
    );
    if (!lineup.length) {
      if (i === 0) continue;
      break;
    }
    const done = lineup.every((id) => {
      const logs = logsByDay[key] || {};
      return (
        logs[logKey("theory", id)]?.status === "done" &&
        logs[logKey("practical", id)]?.status === "done"
      );
    });
    if (!done) {
      if (i === 0) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

async function buildPlan(anchor = new Date()) {
  await ensureLogIndexes();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = mondayOf(anchor);
  const subjects = await Subject.find().sort({ order: 1 }).lean();
  const settings = await getSettings();
  const from = dayKey(addDays(today, -60));
  const to = dayKey(addDays(start, 6));
  const logs = await StudyLog.find({ day: { $gte: from, $lte: to } }).lean();
  const logsByDay = {};
  for (const log of logs) {
    if (!logsByDay[log.day]) logsByDay[log.day] = {};
    logsByDay[log.day][logKey(log.kind, log.subject)] = log;
  }
  const lastDone = await lastDoneBySubject();
  const todayKeyNow = dayKey(today);

  const days = [];
  for (let i = 0; i < 7; i += 1) {
    days.push(
      await blocksForDay(settings, addDays(start, i), subjects, logsByDay)
    );
  }

  const weekLogs = logs.filter(
    (log) =>
      log.status === "done" &&
      log.day >= days[0].key &&
      log.day <= days[6].key
  );
  const balance = {
    theory: weekLogs.filter((item) => item.kind === "theory").length,
    practical: weekLogs.filter((item) => item.kind === "practical").length,
    review: weekLogs.filter((item) => item.kind === "review").length,
  };

  const inWeek = new Set(
    days.flatMap((day) => day.lineup.map((item) => String(item._id)))
  );
  const neglected = subjects.map((subject) => {
    const last = lastDone[String(subject._id)] || null;
    return {
      _id: subject._id,
      name: subject.name,
      slug: subject.slug,
      shortName: subject.shortName,
      accent: subject.accent,
      lastDone: last,
      daysAgo: last == null ? null : daysBetween(last, todayKeyNow),
      inWeek: inWeek.has(String(subject._id)),
    };
  });

  const todayRow = days.find((item) => item.key === todayKeyNow) || days[0];
  const todayIndex = days.findIndex((item) => item.key === todayKeyNow);
  const tomorrow =
    todayIndex >= 0 ? days[todayIndex + 1] || null : days[1] || null;

  let planned30 = 0;
  let complete30 = 0;
  for (let i = 0; i < 30; i += 1) {
    const date = addDays(today, -i);
    date.setHours(12, 0, 0, 0);
    const lineup = idList(rotationFor(settings, date.getDay()).subjects);
    if (!lineup.length) continue;
    planned30 += 1;
    const row = logsByDay[dayKey(date)] || {};
    const ok = lineup.every(
      (sid) =>
        row[logKey("theory", sid)]?.status === "done" &&
        row[logKey("practical", sid)]?.status === "done"
    );
    if (ok) complete30 += 1;
  }

  const journalFrom = dayKey(addDays(today, -29));
  const topicIds = [
    ...new Set(
      logs
        .map((log) => (log.topic ? String(log.topic) : ""))
        .filter(Boolean)
    ),
  ];
  const topics = topicIds.length
    ? await Topic.find({ _id: { $in: topicIds } })
        .select("title slNo")
        .lean()
    : [];
  const topicById = Object.fromEntries(
    topics.map((topic) => [String(topic._id), topic])
  );
  const journal = buildJournal({
    settings,
    subjects,
    logs,
    topicById,
    fromKey: journalFrom,
    toKey: todayKeyNow,
  });

  return {
    settings: {
      slotsPerDay: clampSlots(settings.slotsPerDay),
      rotation: settings.rotation,
    },
    subjects: subjects.map(slimSubject),
    days,
    today: todayRow,
    tomorrow,
    neglected,
    streak: computeStreak(settings, subjects, logsByDay, today),
    balance,
    history: {
      complete30,
      planned30,
      days: journal.days,
      bySubject: journal.bySubject,
    },
  };
}

router.get("/plan", async (req, res) => {
  try {
    const from = parseDay(req.query.from) || new Date();
    res.json(await buildPlan(from));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const allSubjects = await Subject.find().lean();
    const settings = await getSettings();
    const validIds = new Set(allSubjects.map((s) => String(s._id)));
    const slotsPerDay = clampSlots(
      req.body?.slotsPerDay ?? settings.slotsPerDay
    );
    settings.slotsPerDay = slotsPerDay;

    const current = Object.fromEntries(
      (settings.rotation || []).map((row) => [
        Number(row.weekday),
        sanitizeSubjects(row.subjects, validIds, slotsPerDay),
      ])
    );

    if (Array.isArray(req.body?.rotation)) {
      for (const row of req.body.rotation) {
        const weekday = Number(row.weekday);
        if (weekday < 0 || weekday > 6) continue;
        current[weekday] = sanitizeSubjects(
          row.subjects,
          validIds,
          slotsPerDay
        );
      }
    }

    if (req.body?.applyToWeek && Array.isArray(req.body?.subjects)) {
      const mix = sanitizeSubjects(req.body.subjects, validIds, slotsPerDay);
      for (let weekday = 0; weekday <= 6; weekday += 1) {
        current[weekday] = mix;
      }
    }

    settings.rotation = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      subjects: current[weekday] || [],
    }));
    await settings.save();
    res.json(await buildPlan(new Date()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/logs", async (req, res) => {
  try {
    await ensureLogIndexes();
    const day = dayKey(parseDay(req.body?.day) || new Date());
    const kind = req.body?.kind;
    const status = req.body?.status;
    const subject = req.body?.subject || null;
    if (!KINDS.includes(kind)) {
      return res
        .status(400)
        .json({ message: "Choose theory, practical, or review." });
    }
    if (status === "open") {
      await StudyLog.deleteOne({ day, kind, subject });
    } else {
      if (!STATUSES.includes(status)) {
        return res
          .status(400)
          .json({ message: "Mark the block done or skipped." });
      }
      await StudyLog.findOneAndUpdate(
        { day, kind, subject },
        {
          day,
          kind,
          status,
          subject,
          topic: req.body?.topic || null,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }
    res.json(await buildPlan(new Date()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/advance", async (req, res) => {
  try {
    const kind = req.body?.kind === "practical" ? "practical" : "theory";
    const subject = await Subject.findById(req.body?.subject).lean();
    if (!subject) {
      return res.status(400).json({ message: "Pick a subject." });
    }
    const settings = await getSettings();
    const mains = await mainTopics(subject._id, kind);
    if (!mains.length) {
      return res.status(400).json({ message: "No topics in this track yet." });
    }
    const key = focusKey(subject._id, kind);
    const currentId = String(
      req.body?.topic || settings.focus?.[key] || mains[0]._id
    );
    const index = mains.findIndex((item) => String(item._id) === currentId);
    const next = mains[index + 1] || mains[0];
    const focus = { ...(settings.focus || {}) };
    focus[key] = String(next._id);
    settings.focus = focus;
    settings.markModified("focus");
    await settings.save();
    res.json(await buildPlan(new Date()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
