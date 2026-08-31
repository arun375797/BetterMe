import { analyzeSleep } from "./sleepStats.js";

const FOOD_SLOTS = ["morning", "afternoon", "evening", "night"];
const STAT_MAX = 1000;
const WEEK_CAP = 140;
const MONTH_CAP = 360;
const QUARTER_CAP = 500;

const RANK_LADDER = [
  { min: 0, rank: "E", title: "E-Rank Unawakened", color: "#93a0b5", next: 50 },
  { min: 50, rank: "D", title: "D-Rank Adventurer", color: "#e88b7a", next: 150 },
  { min: 150, rank: "C", title: "C-Rank Warrior", color: "#e8c36a", next: 300 },
  { min: 300, rank: "B", title: "B-Rank Champion", color: "#6ec8ff", next: 500 },
  { min: 500, rank: "A", title: "A-Rank Hero", color: "#b9a6ff", next: 700 },
  { min: 700, rank: "S", title: "S-Rank Legend", color: "#3ce6d4", next: 900 },
  { min: 900, rank: "SS", title: "SS-Rank Transcendent", color: "#e8c36a", next: null },
];

const CLASS_BY_STAT = {
  str: { name: "Iron Warrior", epithet: "Tempered by iron and will" },
  agi: { name: "Wind Striker", epithet: "Swift on the court and the mat" },
  end: { name: "Ash Knight", epithet: "The one who does not stop" },
  vit: { name: "Restborn Guardian", epithet: "Power recovered in the dark" },
  rec: { name: "Dreamwarden", epithet: "A steady clock, a recovered body" },
  dis: { name: "Oathkeeper", epithet: "Every meal a vow kept" },
  ntr: { name: "Kitchen Alchemist", epithet: "Protein, fiber, and a calm glycemic tide" },
  ctl: { name: "Blood Sage", epithet: "The inner tide held still" },
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function ymd(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayKey(value) {
  if (value == null) return "";
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return ymd(d);
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function clamp(n, min = 0, max = STAT_MAX) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function avg(values) {
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function classifySugar(level, mealTiming) {
  if (mealTiming === "before") {
    if (level < 70) return "low";
    if (level <= 99) return "in range";
    if (level <= 125) return "elevated";
    return "high";
  }
  if (level < 70) return "low";
  if (level <= 139) return "in range";
  if (level <= 179) return "elevated";
  return "high";
}

function daysSince(date) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now - d) / 86400000));
}

function daysSinceDay(day) {
  const key = dayKey(day);
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  if (!y) return null;
  const then = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  then.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now - then) / 86400000));
}

function weekRange(n) {
  const start = daysAgo(7 * n + 6);
  const end =
    n === 0
      ? new Date()
      : (() => {
          const d = daysAgo(7 * n);
          d.setHours(23, 59, 59, 999);
          return d;
        })();
  return { start, end, fromDay: ymd(start), toDay: ymd(end) };
}

function inRange(date, start, end) {
  const t = date instanceof Date ? date : new Date(date);
  return t >= start && t <= end;
}

function exerciseIn(sessions, start, end, kind) {
  return sessions.filter((s) => {
    if (kind && s.kind !== kind) return false;
    return inRange(s.recordedAt, start, end);
  });
}

function minutesOf(list) {
  return list.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
}

function lastSessionDate(sessions, kinds) {
  const filtered = sessions.filter((s) => !kinds || kinds.includes(s.kind));
  if (!filtered.length) return null;
  return filtered.reduce(
    (latest, s) =>
      !latest || new Date(s.recordedAt) > new Date(latest)
        ? s.recordedAt
        : latest,
    null
  );
}

function streakDays(sessions, dayCount = 90) {
  const byDay = new Map();
  for (let i = 0; i < dayCount; i += 1) {
    byDay.set(ymd(daysAgo(i)), 0);
  }
  for (const s of sessions) {
    const key = ymd(s.recordedAt);
    if (byDay.has(key)) {
      byDay.set(key, byDay.get(key) + (s.durationMinutes || 0));
    }
  }
  const keys = [...byDay.keys()].sort();
  let streak = 0;
  for (let i = keys.length - 1; i >= 0; i -= 1) {
    if (byDay.get(keys[i]) > 0) streak += 1;
    else if (i !== keys.length - 1) break;
  }
  if (streak === 0 && keys.length > 1) {
    for (let i = keys.length - 2; i >= 0; i -= 1) {
      if (byDay.get(keys[i]) > 0) streak += 1;
      else break;
    }
  }
  return streak;
}

function activeDays(sessions, start, end) {
  const days = new Set();
  for (const s of sessions) {
    if (inRange(s.recordedAt, start, end)) days.add(ymd(s.recordedAt));
  }
  return days.size;
}

function weeksHitting(sessions, weekCount, minMinutes, kind) {
  let hits = 0;
  for (let w = 0; w < weekCount; w += 1) {
    const { start, end } = weekRange(w);
    if (minutesOf(exerciseIn(sessions, start, end, kind)) >= minMinutes) {
      hits += 1;
    }
  }
  return hits;
}

function foodWindow(logs, fromDay, toDay) {
  const inSpan = logs.filter((l) => {
    const day = dayKey(l.day);
    return day >= fromDay && day <= toDay;
  });
  const byDay = new Map();
  for (const log of inSpan) {
    const day = dayKey(log.day);
    if (!byDay.has(day)) byDay.set(day, {});
    byDay.get(day)[log.slot] = log;
  }
  let eaten = 0;
  let skipped = 0;
  let complete = 0;
  for (const slots of byDay.values()) {
    let dayEaten = 0;
    for (const slot of FOOD_SLOTS) {
      const entry = slots[slot];
      if (!entry) continue;
      if (entry.status === "eaten") {
        eaten += 1;
        dayEaten += 1;
      } else skipped += 1;
    }
    if (dayEaten === 4) complete += 1;
  }
  const logged = eaten + skipped;
  return {
    eaten,
    skipped,
    logged,
    complete,
    daysWithLogs: byDay.size,
    adherence: logged ? (eaten / logged) * 100 : 0,
  };
}

function nutritionDays(logs, fromDay, toDay) {
  const byDay = new Map();
  for (const log of logs) {
    const day = dayKey(log.day);
    if (day < fromDay || day > toDay) continue;
    if (log.status !== "eaten") continue;
    if (!byDay.has(day)) {
      byDay.set(day, { protein: 0, fiber: 0, highGi: 0, eaten: 0 });
    }
    const row = byDay.get(day);
    row.protein += Number(log.proteinG) || 0;
    row.fiber += Number(log.fiberG) || 0;
    row.eaten += 1;
    if (log.glycemicIndex === "high") row.highGi += 1;
  }
  const rows = [...byDay.values()];
  const proteinDays = rows.filter((r) => r.protein >= 60).length;
  const fiberDays = rows.filter((r) => r.fiber >= 25).length;
  const calmGiDays = rows.filter((r) => r.highGi <= 1).length;
  const qualityDays = rows.filter(
    (r) => r.protein >= 60 && r.fiber >= 25 && r.highGi <= 1
  ).length;
  return {
    days: rows.length,
    proteinDays,
    fiberDays,
    calmGiDays,
    qualityDays,
  };
}

function sleepWindow(logs, fromDay, toDay) {
  return logs.filter((l) => {
    const day = dayKey(l.day);
    return day >= fromDay && day <= toDay;
  });
}

function isGoodNight(log) {
  const hours = (Number(log.durationMinutes) || 0) / 60;
  const qualityOk = log.quality == null || Number(log.quality) >= 6;
  return hours >= 7 && hours <= 9 && qualityOk;
}

function timeToMinutes(t) {
  const parts = String(t || "").split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h)) return null;
  return ((h * 60 + (Number.isFinite(m) ? m : 0)) % 1440 + 1440) % 1440;
}

function bedtimeSpread(logs) {
  const values = logs.map((l) => timeToMinutes(l.bedTime)).filter((n) => n != null);
  if (values.length < 3) return null;
  const rad = values.map((v) => (v / 1440) * 2 * Math.PI);
  const x = avg(rad.map(Math.cos));
  const y = avg(rad.map(Math.sin));
  const mean = Math.atan2(y, x);
  const diffs = rad.map((a) => {
    let d = Math.abs(a - mean);
    if (d > Math.PI) d = 2 * Math.PI - d;
    return (d / (2 * Math.PI)) * 1440;
  });
  return avg(diffs);
}

function combineScore({ week, month, quarter, idleDays, grace = 3, rate = 18 }) {
  const raw =
    clamp(week, 0, WEEK_CAP) +
    clamp(month, 0, MONTH_CAP) +
    clamp(quarter, 0, QUARTER_CAP);
  if (raw <= 0) return 0;
  if (idleDays == null || idleDays <= grace) return clamp(raw, 0, STAT_MAX);
  return clamp(raw - (idleDays - grace) * rate, 0, STAT_MAX);
}

function rankFromLevel(level) {
  let current = RANK_LADDER[0];
  for (const rung of RANK_LADDER) {
    if (level >= rung.min) current = rung;
  }
  const span = current.next == null ? 100 : current.next - current.min;
  const into = current.next == null ? span : level - current.min;
  const xpPct =
    current.next == null ? 100 : clamp((into / span) * 100, 0, 100);
  const nextRung = RANK_LADDER.find((r) => r.min === current.next) || null;
  return {
    rank: current.rank,
    title: current.title,
    color: current.color,
    min: current.min,
    nextAt: current.next,
    xpInto: current.next == null ? span : into,
    xpNeed: span,
    xpPct,
    nextRank: nextRung?.rank ?? null,
    nextTitle: nextRung?.title ?? "Peak reached",
    pointsToNext:
      current.next == null ? 0 : Math.max(0, current.next - level),
  };
}

function gradeFromValue(value) {
  if (value <= 0) return "—";
  if (value >= 950) return "SS";
  if (value >= 850) return "S";
  if (value >= 700) return "A";
  if (value >= 500) return "B";
  if (value >= 300) return "C";
  if (value >= 150) return "D";
  return "E";
}

function trendDelta(current, previous) {
  if (current == null || previous == null) return 0;
  return Math.round(current - previous);
}

function heroClass(stats, level) {
  if (level <= 0) {
    return {
      name: "Unawakened",
      epithet: "Level 0. Touch a stat to learn how it rises from nothing.",
    };
  }
  if (level < 50) {
    return {
      name: "Wandering Novice",
      epithet: "The first logs are in. The grind to 1000 has started.",
    };
  }
  const values = stats.map((s) => s.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (level >= 300 && max - min <= 120) {
    return {
      name: "Balanced Hero",
      epithet: "No dump stat. Every path is trained.",
    };
  }
  const top = [...stats].sort((a, b) => b.value - a.value)[0];
  return CLASS_BY_STAT[top.id] || CLASS_BY_STAT.str;
}

function fmt(n, digits = 0) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(digits);
}

function compare(label, you, target, unit = "", better = "higher") {
  const youN = typeof you === "number" ? you : null;
  const targetN = typeof target === "number" ? target : null;
  let ok = false;
  if (youN != null && targetN != null) {
    ok = better === "lower" ? youN <= targetN : youN >= targetN;
  }
  return {
    label,
    you: you == null || you === "" ? "—" : `${you}${unit}`,
    target: target == null ? "—" : `${target}${unit}`,
    ok,
  };
}

export function computeReportStats({
  sugarReadings = [],
  exerciseSessions = [],
  mealLogs = [],
  sleepLogs = [],
}) {
  const now = new Date();
  const today = ymd(now);
  const w0 = weekRange(0);
  const w1 = weekRange(1);
  const monthStart = daysAgo(29);
  const quarterStart = daysAgo(89);
  const monthFrom = ymd(monthStart);
  const quarterFrom = ymd(quarterStart);

  const weightWeek = exerciseIn(exerciseSessions, w0.start, w0.end, "weight");
  const weightPrev = exerciseIn(exerciseSessions, w1.start, w1.end, "weight");
  const weightMonth = exerciseIn(exerciseSessions, monthStart, now, "weight");
  const weightQuarter = exerciseIn(exerciseSessions, quarterStart, now, "weight");
  const yogaWeek = exerciseIn(exerciseSessions, w0.start, w0.end, "yoga");
  const yogaPrev = exerciseIn(exerciseSessions, w1.start, w1.end, "yoga");
  const yogaMonth = exerciseIn(exerciseSessions, monthStart, now, "yoga");
  const yogaQuarter = exerciseIn(exerciseSessions, quarterStart, now, "yoga");
  const badmWeek = exerciseIn(exerciseSessions, w0.start, w0.end, "badminton");
  const badmPrev = exerciseIn(exerciseSessions, w1.start, w1.end, "badminton");
  const badmMonth = exerciseIn(exerciseSessions, monthStart, now, "badminton");
  const badmQuarter = exerciseIn(exerciseSessions, quarterStart, now, "badminton");
  const allWeek = exerciseIn(exerciseSessions, w0.start, w0.end);
  const allPrev = exerciseIn(exerciseSessions, w1.start, w1.end);
  const allMonth = exerciseIn(exerciseSessions, monthStart, now);
  const allQuarter = exerciseIn(exerciseSessions, quarterStart, now);

  const weightMin = minutesOf(weightWeek);
  const yogaMin = minutesOf(yogaWeek);
  const badmMin = minutesOf(badmWeek);
  const totalWeekMin = minutesOf(allWeek);
  const totalPrevMin = minutesOf(allPrev);
  const streak = streakDays(exerciseSessions);
  const feltWeek = weightWeek.filter((s) => s.felt != null).map((s) => s.felt);
  const feltAvg = feltWeek.length ? avg(feltWeek) : null;

  const strIdle = daysSince(lastSessionDate(exerciseSessions, ["weight"]));
  const agiIdle = daysSince(
    lastSessionDate(exerciseSessions, ["yoga", "badminton"])
  );
  const endIdle = daysSince(lastSessionDate(exerciseSessions, null));

  const strWeek =
    weightWeek.length === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          (weightMin / 90) * 80 +
            Math.min(40, weightWeek.length * 18) +
            (feltAvg != null ? (feltAvg / 10) * 20 : 0)
        );
  const strMonth = (weightMonth.length / 8) * MONTH_CAP;
  const strQuarter = (weightQuarter.length / 24) * QUARTER_CAP;
  const str = combineScore({
    week: strWeek,
    month: strMonth,
    quarter: strQuarter,
    idleDays: strIdle,
  });
  const strPrev = combineScore({
    week:
      weightPrev.length === 0
        ? 0
        : Math.min(
            WEEK_CAP,
            (minutesOf(weightPrev) / 90) * 80 + weightPrev.length * 18
          ),
    month: (weightMonth.length / 8) * MONTH_CAP,
    quarter: (weightQuarter.length / 24) * QUARTER_CAP,
    idleDays: 0,
  });

  const agiWeek =
    yogaWeek.length + badmWeek.length === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          (yogaMin / 60) * 55 +
            (badmMin / 90) * 85 +
            (yogaWeek.length && badmWeek.length ? 20 : 0)
        );
  const agiMonth =
    (weeksHitting(exerciseSessions, 4, 60, "yoga") / 4) * 140 +
    (weeksHitting(exerciseSessions, 4, 90, "badminton") / 4) * 220;
  const agiQuarter =
    (weeksHitting(exerciseSessions, 12, 60, "yoga") / 12) * 200 +
    (weeksHitting(exerciseSessions, 12, 90, "badminton") / 12) * 300;
  const agi = combineScore({
    week: agiWeek,
    month: agiMonth,
    quarter: agiQuarter,
    idleDays: agiIdle,
  });
  const agiPrev = combineScore({
    week:
      yogaPrev.length + badmPrev.length === 0
        ? 0
        : Math.min(
            WEEK_CAP,
            (minutesOf(yogaPrev) / 60) * 55 + (minutesOf(badmPrev) / 90) * 85
          ),
    month: agiMonth,
    quarter: agiQuarter,
    idleDays: 0,
  });

  const whoWeeksMonth = weeksHitting(exerciseSessions, 4, 150, null);
  const whoWeeksQuarter = weeksHitting(exerciseSessions, 12, 150, null);
  const endWeek =
    allWeek.length === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          (totalWeekMin / 150) * 90 + Math.min(streak, 7) * 7
        );
  const endMonth =
    (whoWeeksMonth / 4) * 220 + (activeDays(allMonth, monthStart, now) / 20) * 140;
  const endQuarter =
    (whoWeeksQuarter / 12) * 320 +
    (activeDays(allQuarter, quarterStart, now) / 60) * 180;
  const end = combineScore({
    week: endWeek,
    month: endMonth,
    quarter: endQuarter,
    idleDays: endIdle,
  });
  const endPrev = combineScore({
    week:
      allPrev.length === 0
        ? 0
        : Math.min(WEEK_CAP, (totalPrevMin / 150) * 90),
    month: endMonth,
    quarter: endQuarter,
    idleDays: 0,
  });

  const sleepWeekLogs = sleepWindow(sleepLogs, w0.fromDay, today);
  const sleepPrevLogs = sleepWindow(sleepLogs, w1.fromDay, w1.toDay);
  const sleepMonthLogs = sleepWindow(sleepLogs, monthFrom, today);
  const sleepQuarterLogs = sleepWindow(sleepLogs, quarterFrom, today);
  const goodWeek = sleepWeekLogs.filter(isGoodNight).length;
  const goodMonth = sleepMonthLogs.filter(isGoodNight).length;
  const goodQuarter = sleepQuarterLogs.filter(isGoodNight).length;
  const sleepScores = sleepWeekLogs.map((l) => analyzeSleep(l).overall);
  const vitIdle = daysSinceDay(sleepLogs[0]?.day);
  const vitWeek =
    sleepWeekLogs.length === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          (goodWeek / 7) * 90 +
            (avg(sleepScores) || 0) * 0.35 +
            Math.min(sleepWeekLogs.length, 7) * 4
        );
  const vitMonth = (goodMonth / 21) * MONTH_CAP;
  const vitQuarter = (goodQuarter / 63) * QUARTER_CAP;
  const vit = combineScore({
    week: vitWeek,
    month: vitMonth,
    quarter: vitQuarter,
    idleDays: vitIdle,
    rate: 22,
  });
  const vitPrev = combineScore({
    week:
      sleepPrevLogs.length === 0
        ? 0
        : Math.min(
            WEEK_CAP,
            (sleepPrevLogs.filter(isGoodNight).length / 7) * 90
          ),
    month: vitMonth,
    quarter: vitQuarter,
    idleDays: 0,
  });

  const spreadMonth = bedtimeSpread(sleepMonthLogs);
  const spreadWeek = bedtimeSpread(sleepWeekLogs);
  const weightDaysWeek = new Set(weightWeek.map((s) => ymd(s.recordedAt))).size;
  const restOk = weightDaysWeek > 0 && weightDaysWeek <= 5;
  const recIdle = vitIdle;
  const recWeek =
    sleepWeekLogs.length === 0 && weightWeek.length === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          (goodWeek / 7) * 50 +
            (spreadWeek != null && spreadWeek <= 60 ? 40 : spreadWeek != null && spreadWeek <= 90 ? 20 : 0) +
            (restOk ? 25 : weightDaysWeek >= 7 ? 0 : 10) +
            sleepWeekLogs.length * 3
        );
  const recMonth =
    (goodMonth / 21) * 180 +
    (spreadMonth != null && spreadMonth <= 60
      ? 120
      : spreadMonth != null && spreadMonth <= 90
        ? 60
        : 0) +
    (sleepMonthLogs.length / 25) * 60;
  const recQuarter =
    (goodQuarter / 63) * 280 +
    (sleepQuarterLogs.length / 70) * 220;
  const rec = combineScore({
    week: recWeek,
    month: recMonth,
    quarter: recQuarter,
    idleDays: recIdle,
    rate: 20,
  });
  const recPrev = combineScore({
    week:
      sleepPrevLogs.length === 0
        ? 0
        : Math.min(
            WEEK_CAP,
            (sleepPrevLogs.filter(isGoodNight).length / 7) * 50
          ),
    month: recMonth,
    quarter: recQuarter,
    idleDays: 0,
  });

  const foodWeek = foodWindow(mealLogs, w0.fromDay, today);
  const foodPrev = foodWindow(mealLogs, w1.fromDay, w1.toDay);
  const foodMonth = foodWindow(mealLogs, monthFrom, today);
  const foodQuarter = foodWindow(mealLogs, quarterFrom, today);
  const disIdle = daysSinceDay(mealLogs[0]?.day);
  const disWeek =
    foodWeek.logged === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          (foodWeek.complete / 7) * 80 +
            (foodWeek.adherence / 100) * 40 +
            Math.min(20, foodWeek.daysWithLogs * 3)
        );
  const disMonth = (foodMonth.complete / 20) * MONTH_CAP;
  const disQuarter = (foodQuarter.complete / 60) * QUARTER_CAP;
  const dis = combineScore({
    week: disWeek,
    month: disMonth,
    quarter: disQuarter,
    idleDays: disIdle,
  });
  const disPrevScore = combineScore({
    week:
      foodPrev.logged === 0
        ? 0
        : Math.min(WEEK_CAP, (foodPrev.complete / 7) * 80 + foodPrev.adherence * 0.4),
    month: disMonth,
    quarter: disQuarter,
    idleDays: 0,
  });

  const ntrWeek = nutritionDays(mealLogs, w0.fromDay, today);
  const ntrPrev = nutritionDays(mealLogs, w1.fromDay, w1.toDay);
  const ntrMonth = nutritionDays(mealLogs, monthFrom, today);
  const ntrQuarter = nutritionDays(mealLogs, quarterFrom, today);
  const ntrIdle = disIdle;
  const ntrWeekScore =
    ntrWeek.days === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          (ntrWeek.qualityDays / 7) * 80 +
            (ntrWeek.proteinDays / 7) * 30 +
            (ntrWeek.fiberDays / 7) * 30
        );
  const ntr = combineScore({
    week: ntrWeekScore,
    month: (ntrMonth.qualityDays / 18) * MONTH_CAP,
    quarter: (ntrQuarter.qualityDays / 55) * QUARTER_CAP,
    idleDays: ntrIdle,
  });
  const ntrPrevScore = combineScore({
    week:
      ntrPrev.days === 0
        ? 0
        : Math.min(WEEK_CAP, (ntrPrev.qualityDays / 7) * 80),
    month: (ntrMonth.qualityDays / 18) * MONTH_CAP,
    quarter: (ntrQuarter.qualityDays / 55) * QUARTER_CAP,
    idleDays: 0,
  });

  const sugarWeek = sugarReadings.filter((r) => inRange(r.recordedAt, w0.start, w0.end));
  const sugarPrev = sugarReadings.filter((r) => inRange(r.recordedAt, w1.start, w1.end));
  const sugarMonth = sugarReadings.filter((r) => inRange(r.recordedAt, monthStart, now));
  const sugarQuarter = sugarReadings.filter((r) =>
    inRange(r.recordedAt, quarterStart, now)
  );
  const sugarDaysWeek = new Set(sugarWeek.map((r) => ymd(r.recordedAt))).size;
  const sugarDaysMonth = new Set(sugarMonth.map((r) => ymd(r.recordedAt))).size;
  const sugarDaysQuarter = new Set(sugarQuarter.map((r) => ymd(r.recordedAt))).size;
  const weekStatuses = sugarWeek.map((r) => classifySugar(r.level, r.mealTiming));
  const inRangeWeek = weekStatuses.filter((s) => s === "in range").length;
  const highWeek = weekStatuses.filter((s) => s === "high" || s === "elevated").length;
  const lowWeek = weekStatuses.filter((s) => s === "low").length;
  const inRangeRatio = sugarWeek.length ? inRangeWeek / sugarWeek.length : 0;
  const inRangeMonth = sugarMonth.filter(
    (r) => classifySugar(r.level, r.mealTiming) === "in range"
  ).length;
  const inRangeQuarter = sugarQuarter.filter(
    (r) => classifySugar(r.level, r.mealTiming) === "in range"
  ).length;
  const ctlIdle = daysSince(sugarReadings[0]?.recordedAt);
  const ctlWeek =
    sugarWeek.length === 0
      ? 0
      : Math.min(
          WEEK_CAP,
          inRangeRatio * 90 +
            Math.min(30, sugarDaysWeek * 5) -
            highWeek * 8 -
            lowWeek * 6
        );
  const ctlMonth =
    (sugarDaysMonth / 24) * 140 +
    (sugarMonth.length ? (inRangeMonth / sugarMonth.length) * 220 : 0);
  const ctlQuarter =
    (sugarDaysQuarter / 70) * 200 +
    (sugarQuarter.length ? (inRangeQuarter / sugarQuarter.length) * 300 : 0);
  const ctl = combineScore({
    week: Math.max(0, ctlWeek),
    month: ctlMonth,
    quarter: ctlQuarter,
    idleDays: ctlIdle,
  });
  const prevStatuses = sugarPrev.map((r) => classifySugar(r.level, r.mealTiming));
  const ctlPrevScore = combineScore({
    week:
      sugarPrev.length === 0
        ? 0
        : Math.min(
            WEEK_CAP,
            (prevStatuses.filter((s) => s === "in range").length /
              sugarPrev.length) *
              90
          ),
    month: ctlMonth,
    quarter: ctlQuarter,
    idleDays: 0,
  });

  const avgSleepHours = sleepWeekLogs.length
    ? avg(sleepWeekLogs.map((l) => (l.durationMinutes || 0) / 60))
    : null;

  const stats = [
    {
      id: "str",
      label: "STR",
      name: "Strength",
      value: str,
      previous: strPrev,
      color: "#e88b7a",
      source: "Weight training",
      href: "/health/exercise/weight",
      idleDays: strIdle,
      decaying: str > 0 && strIdle != null && strIdle > 3,
      detail:
        weightWeek.length === 0
          ? "No weight sessions this week — STR is 0 until you log one."
          : `${weightWeek.length} session(s) · ${weightMin} min · felt ${feltAvg != null ? fmt(feltAvg, 1) : "—"}`,
      questTitle: "Forge Strength",
      quest:
        weightMin < 45
          ? "Log a 45-minute weight session. ACSM: train each major muscle group at least 2 days this week."
          : weightWeek.length < 2
            ? "Add a second lifting day this week — two sessions is the research floor, not the ceiling."
            : "Keep 2–3 lifting days each week for 12 weeks. That is the road to 1000 STR.",
      guide: {
        meaning:
          "How much force your muscles can produce. In this window it is built only from weight-training logs — not yoga, not badminton.",
        research:
          "ACSM: resistance training ≥2 days/week for all major muscle groups, typically 30–60 minutes. Felt score is your session quality (effort you can repeat next time, not a one-rep max).",
        target:
          "Gold week: 2 sessions, 90+ minutes total, felt ≥ 6. Gold path to 1000: about 24 quality sessions across 12 weeks (2/week), without long gaps.",
        compare: [
          compare("Sessions this week", weightWeek.length, 2),
          compare("Minutes this week", weightMin, 90, " min"),
          compare("Sessions in 30 days", weightMonth.length, 8),
          compare("Sessions in 90 days", weightQuarter.length, 24),
          compare("Felt average (1–10)", feltAvg != null ? Number(fmt(feltAvg, 1)) : null, 6),
        ],
        steps: [
          "Open Weight training and log what you lifted, why, minutes, and how it felt.",
          "Hit two days this week, even if the first session is only 30 minutes.",
          "Leave at least one rest day between hard lower-body days — recovery is a separate stat, but skipped rest makes both fall.",
          "Do not chase 1000 in a weekend. One excellent week is about 100–140 STR. The rest is 30- and 90-day consistency.",
        ],
        next:
          weightWeek.length === 0
            ? "First lift this week is worth the biggest jump — STR cannot move from 0 without a log."
            : "A second session this week is the ACSM minimum and the next STR chunk.",
      },
    },
    {
      id: "agi",
      label: "AGI",
      name: "Agility",
      value: agi,
      previous: agiPrev,
      color: "#6ec8ff",
      source: "Yoga & badminton",
      href: "/health/exercise",
      idleDays: agiIdle,
      decaying: agi > 0 && agiIdle != null && agiIdle > 3,
      detail:
        yogaWeek.length + badmWeek.length === 0
          ? "No yoga or badminton this week — AGI stays 0."
          : `Yoga ${yogaMin} min · badminton ${badmMin} min`,
      questTitle: "Hone Agility",
      quest:
        yogaMin < 20
          ? "Log a yoga session (20–30 min). ACSM: stretch or flow at least 2–3 days/week."
          : badmMin < 30
            ? "Add badminton. WHO counts it as moderate-to-vigorous cardio toward 150 minutes/week."
            : "Keep both this week: yoga for mobility, badminton for speed. 1000 AGI needs both over 12 weeks.",
      guide: {
        meaning:
          "Speed, mobility, and change of direction. Yoga fills the mobility half. Badminton fills the sport/cardio half. One without the other caps how high AGI can climb.",
        research:
          "ACSM flexibility: ≥2–3 days/week, 10–30 minutes. WHO adults: 150 minutes moderate (or 75 vigorous) aerobic activity weekly — badminton counts here.",
        target:
          "Gold week: 60 min yoga + 90 min badminton. Path to 1000: hit those floors most weeks for ~12 weeks.",
        compare: [
          compare("Yoga minutes this week", yogaMin, 60, " min"),
          compare("Yoga sessions this week", yogaWeek.length, 2),
          compare("Badminton minutes this week", badmMin, 90, " min"),
          compare("Yoga-target weeks (30d)", weeksHitting(exerciseSessions, 4, 60, "yoga"), 4),
          compare("Badminton-target weeks (30d)", weeksHitting(exerciseSessions, 4, 90, "badminton"), 4),
        ],
        steps: [
          "If you are stiff or coming off rest: start with 20 minutes of yoga and log it under Yoga.",
          "Add a badminton session for heart rate and footwork — that is the AGI spike yoga cannot give.",
          "A week with only one of the two will grow AGI slowly. Both in the same week is the intended path.",
          "Twelve mixed weeks beat one heroic week. Gaps of more than 3 days start the decay.",
        ],
        next:
          yogaWeek.length === 0
            ? "Log yoga today — even a short flow wakes AGI from 0."
            : badmWeek.length === 0
              ? "Log badminton this week so AGI is not only mobility."
              : "Repeat both next week. 30-day consistency is most of the score.",
      },
    },
    {
      id: "end",
      label: "END",
      name: "Endurance",
      value: end,
      previous: endPrev,
      color: "#ff9f6b",
      source: "All movement",
      href: "/health/exercise",
      idleDays: endIdle,
      decaying: end > 0 && endIdle != null && endIdle > 3,
      detail:
        allWeek.length === 0
          ? "No movement logged this week — END is 0."
          : `${streak}-day streak · ${totalWeekMin} min (yoga + badminton + weights)`,
      questTitle: "Do Not Stop",
      quest:
        totalWeekMin < 30
          ? "Move today for 20–30 minutes — any kind. WHO’s weekly floor is 150 minutes of moderate activity."
          : totalWeekMin < 150
            ? `You have ${totalWeekMin} of 150 WHO minutes this week. Another session closes the gap.`
            : "You hit this week’s 150. Protect the streak — 12 such weeks is how END approaches 1000.",
      guide: {
        meaning:
          "Work capacity and the habit of showing up. Every yoga, badminton, and weight session counts. Streaks matter more here than in any other stat.",
        research:
          "WHO 2020: adults should do at least 150 minutes of moderate-intensity activity per week (or 75 vigorous), plus muscle-strengthening on 2+ days. Sitting less also counts as a win.",
        target:
          "Gold week: 150+ minutes across any mix, and a moving streak. Path to 1000: about 12 weeks at that floor, with 20+ active days per 30.",
        compare: [
          compare("Minutes this week", totalWeekMin, 150, " min"),
          compare("Active days this week", activeDays(allWeek, w0.start, w0.end), 5),
          compare("Weeks ≥150 min (30d)", whoWeeksMonth, 4),
          compare("Weeks ≥150 min (90d)", whoWeeksQuarter, 12),
          compare("Current streak", streak, 7, "d"),
        ],
        steps: [
          "If you have done nothing: a 20-minute walk-equivalent session (yoga or badminton) is enough to leave 0.",
          "Spread minutes across the week. Seven 20-minute days beat one exhausted 150-minute day for streak and recovery.",
          "Weights count here too — END is total movement, STR is still the lift-specific stat.",
          "Missing more than 3 days in a row cuts END. A short session is how you refuse the rust.",
        ],
        next:
          allWeek.length === 0
            ? "Log any exercise today. END cannot exist without a timestamp."
            : totalWeekMin < 150
              ? `Add ${Math.max(10, 150 - totalWeekMin)} minutes this week to meet the WHO floor.`
              : "Move again tomorrow and extend the streak.",
      },
    },
    {
      id: "vit",
      label: "VIT",
      name: "Vitality",
      value: vit,
      previous: vitPrev,
      color: "#b9a6ff",
      source: "Sleep",
      href: "/health/sleep",
      idleDays: vitIdle,
      decaying: vit > 0 && vitIdle != null && vitIdle > 2,
      detail:
        sleepWeekLogs.length === 0
          ? "No sleep logged this week — Vitality is 0. This is the HP bar."
          : `${sleepWeekLogs.length} night(s) · ${goodWeek} in the 7–9h band · avg ${avgSleepHours != null ? fmt(avgSleepHours, 1) : "—"}h`,
      questTitle: "Restore Vitality",
      quest:
        sleepWeekLogs.length === 0
          ? "Log last night: bed time, wake time, and an honest 1–10 quality. NSF: adults need 7–9 hours."
          : goodWeek < 5
            ? "Protect a 7–9 hour night. Four to six ~90-minute cycles is the usual adult range."
            : "Keep logging every morning. 21 good nights in 30 days is the 30-day Vitality engine.",
      guide: {
        meaning:
          "How recovered you actually are. HP in this window is Vitality. It does not rise from coffee, vitamins on a list, or exercise — only from logged sleep that lands in a healthy band.",
        research:
          "National Sleep Foundation: 7–9 hours for most adults. A full sleep cycle averages ~90 minutes; 4–6 cycles is typical. Regular sleep is as important as duration (circadian timing).",
        target:
          "A good night here: 7–9 hours and quality ≥ 6 (if you rate it). Gold week: 7 logged nights, 5+ good. Path to 1000: ~63 good nights in 90 days.",
        compare: [
          compare("Nights logged this week", sleepWeekLogs.length, 7),
          compare("Good nights (7–9h) this week", goodWeek, 5),
          compare("Average hours this week", avgSleepHours != null ? Number(fmt(avgSleepHours, 1)) : null, 7, "h"),
          compare("Good nights in 30 days", goodMonth, 21),
          compare("Good nights in 90 days", goodQuarter, 63),
        ],
        steps: [
          "Open Sleep and log bed date/time and wake date/time. Duration is computed for you.",
          "Aim to be in bed long enough to actually get 7 hours — not 5 hours plus a late phone session.",
          "Rate quality honestly (1–10). Low quality with long duration still will not max Vitality.",
          "Same-ish bedtime matters too — that is the Recovery stat. Vitality cares that the night itself was long enough and felt restorative.",
          "Skip logging and Vitality stays 0. There is no default HP for an empty sleep log.",
        ],
        next:
          sleepWeekLogs.length === 0
            ? "Log last night now. That is the only way Vitality leaves 0."
            : "Log tonight tomorrow morning, targeting 7–9 hours.",
      },
    },
    {
      id: "rec",
      label: "REC",
      name: "Recovery",
      value: rec,
      previous: recPrev,
      color: "#d4a5ff",
      source: "Sleep timing & rest",
      href: "/health/sleep",
      idleDays: recIdle,
      decaying: rec > 0 && recIdle != null && recIdle > 2,
      detail:
        sleepWeekLogs.length === 0
          ? "Recovery stays 0 until sleep is logged. A steady bedtime is the main lever."
          : `Bedtime spread ${spreadWeek != null ? `${Math.round(spreadWeek)} min` : "—"} · lifting days ${weightDaysWeek}/7`,
      questTitle: "Guard Recovery",
      quest:
        sleepWeekLogs.length < 3
          ? "Log three nights in a row at a similar bedtime (±60 min). Your body clock is the recovery skill."
          : spreadWeek != null && spreadWeek > 90
            ? "Pull bedtime into a 1-hour window. Large swings hurt recovery even if total hours look fine."
            : "Keep the bedtime window tight, and do not lift hard all 7 days — rest days are part of REC.",
      guide: {
        meaning:
          "How well the system can adapt. Distinct from Vitality: VIT is “was last night long and decent?” REC is “is the schedule stable, and are you allowing rest?”",
        research:
          "Circadian research: irregular sleep timing is linked with worse metabolic and mood outcomes even when average hours look acceptable. Strength work also needs rest; ACSM programs use rest days, not 7 lifting days.",
        target:
          "Bedtimes clustered within ~60 minutes, 5+ good nights/week, and at most 5 lifting days/week. Path to 1000: stable sleep logged most of 90 days.",
        compare: [
          compare("Nights logged this week", sleepWeekLogs.length, 7),
          compare("Bedtime spread (week)", spreadWeek != null ? Math.round(spreadWeek) : null, 60, " min", "lower"),
          compare("Bedtime spread (30d)", spreadMonth != null ? Math.round(spreadMonth) : null, 60, " min", "lower"),
          compare("Lifting days this week", weightDaysWeek, 5, "", "lower"),
          compare("Sleep logs in 30 days", sleepMonthLogs.length, 25),
        ],
        steps: [
          "Pick a target bedtime and wake time you can repeat on weekdays — log them every morning.",
          "If spread is high, move bedtime earlier in 15-minute steps rather than one brutal shift.",
          "Take at least one full day without heavy weights if you already lifted 5 days.",
          "Recovery will not rise from vitamins or skipped sleep logs. The clock is the input.",
        ],
        next:
          sleepWeekLogs.length === 0
            ? "Log sleep at a time you can repeat tomorrow."
            : "Match tonight’s bedtime to last night within an hour.",
      },
    },
    {
      id: "dis",
      label: "DIS",
      name: "Discipline",
      value: dis,
      previous: disPrevScore,
      color: "#e8c36a",
      source: "Meal adherence",
      href: "/health/food",
      idleDays: disIdle,
      decaying: dis > 0 && disIdle != null && disIdle > 2,
      detail:
        foodWeek.logged === 0
          ? "No meals logged this week — Discipline is 0."
          : `${foodWeek.eaten} eaten / ${foodWeek.skipped} skipped · ${foodWeek.complete} complete days (all 4 slots)`,
      questTitle: "Keep the Oath",
      quest:
        foodWeek.logged === 0
          ? "Log today’s four slots (morning, afternoon, evening, night) — eaten or skipped. Showing up in the log is the first DIS point."
          : foodWeek.complete < 3
            ? "A complete day is all four meals eaten on plan. Chase 3 complete days this week, then 7."
            : "Aim for 20 complete days in 30. That consistency is most of Discipline’s 1000.",
      guide: {
        meaning:
          "Keeping the eating plan you already built. Skipped slots count against you. Missing logs count as nothing — DIS stays 0, it does not assume you ate.",
        research:
          "Regular meals support glucose stability and training. This app uses four daily slots. Completeness (4/4 eaten) is the performance bar; random grazing with no log cannot score.",
        target:
          "Gold week: 7 complete days (28/28 eaten). Path to 1000: ~60 complete days in 90.",
        compare: [
          compare("Meals eaten this week", foodWeek.eaten, 28),
          compare("Complete days this week", foodWeek.complete, 7),
          compare("Adherence this week", foodWeek.logged ? Math.round(foodWeek.adherence) : null, 90, "%"),
          compare("Complete days in 30d", foodMonth.complete, 20),
          compare("Complete days in 90d", foodQuarter.complete, 60),
        ],
        steps: [
          "Open Food and mark each slot eaten or skipped — honesty beats a fake perfect week.",
          "Start with breakfast (morning). The first logged slot of the day is how DIS leaves 0.",
          "If you skip, log the skip. Hidden skips cannot be coached.",
          "Nutrition quality (protein, fiber, GI) is the Nourish stat. Discipline is showing up for the four slots.",
        ],
        next:
          foodWeek.logged === 0
            ? "Log this morning’s meal to awaken Discipline."
            : "Finish today’s remaining slots so the day can become complete.",
      },
    },
    {
      id: "ntr",
      label: "NTR",
      name: "Nourish",
      value: ntr,
      previous: ntrPrevScore,
      color: "#9ad47a",
      source: "Meal quality",
      href: "/health/food",
      idleDays: ntrIdle,
      decaying: ntr > 0 && ntrIdle != null && ntrIdle > 2,
      detail:
        ntrWeek.days === 0
          ? "No eaten meals with macros this week — Nourish is 0."
          : `${ntrWeek.qualityDays} quality days · protein ${ntrWeek.proteinDays}d · fiber ${ntrWeek.fiberDays}d`,
      questTitle: "Feed Performance",
      quest:
        ntrWeek.days === 0
          ? "Eat a planned meal and log it with protein and fiber. Targets: ~60g protein and 25g fiber per day."
          : ntrWeek.fiberDays < 3
            ? "Push fiber toward 25g/day (vegetables, dal, whole grains). That is the IOM-style adult floor used here."
            : "A quality day is 60g+ protein, 25g+ fiber, and at most one high-GI meal. Stack those days.",
      guide: {
        meaning:
          "Whether the meals you already log can support training and glucose. This is not a new section — it reads protein, fiber, and glycemic index from Food logs.",
        research:
          "Fiber: about 25g/day is a common adult minimum (IOM is 25g women / 38g men). Protein: 60g/day is a modest performance floor without needing your body weight. High-GI meals spike glucose — this app already tags GI on recipes.",
        target:
          "Quality day: protein ≥ 60g, fiber ≥ 25g, ≤1 high-GI eaten meal. Path to 1000: ~55 quality days in 90.",
        compare: [
          compare("Days with eaten meals (week)", ntrWeek.days, 7),
          compare("Protein days ≥60g", ntrWeek.proteinDays, 5),
          compare("Fiber days ≥25g", ntrWeek.fiberDays, 5),
          compare("Quality days this week", ntrWeek.qualityDays, 5),
          compare("Quality days in 30d", ntrMonth.qualityDays, 18),
        ],
        steps: [
          "When you mark a meal eaten, keep the recipe macros filled in — empty protein/fiber cannot raise Nourish.",
          "Build one plate per slot with a protein source and a fiber source.",
          "Prefer low/medium GI recipes after you lift, especially if Control is also low.",
          "Vitamins on your Vitamin page are a reminder list, not a daily score. Nourish only moves from logged meals.",
        ],
        next:
          ntrWeek.days === 0
            ? "Log an eaten meal that includes protein and fiber."
            : "Make today a quality day: 60g protein, 25g fiber, at most one high-GI slot.",
      },
    },
    {
      id: "ctl",
      label: "CTL",
      name: "Control",
      value: ctl,
      previous: ctlPrevScore,
      color: "#3ce6d4",
      source: "Blood sugar",
      href: "/health/sugar",
      idleDays: ctlIdle,
      decaying: ctl > 0 && ctlIdle != null && ctlIdle > 2,
      detail:
        sugarWeek.length === 0
          ? "No sugar readings this week — Control is 0. This is the MP bar."
          : `${inRangeWeek}/${sugarWeek.length} in range · ${highWeek} high/elevated · ${lowWeek} low · ${sugarDaysWeek} days measured`,
      questTitle: "Steady the Tide",
      quest:
        sugarWeek.length === 0
          ? "Take a reading today (before or after a meal). Control cannot move without numbers."
          : sugarDaysWeek < 4
            ? "Measure on more days this week — a single lucky reading is not Control."
            : inRangeRatio < 0.7
              ? "Pair the next reading with a planned meal (Discipline + Nourish). Highs cut CTL hard."
              : "Keep daily readings. 70%+ in-range across 70 days is the long climb to 1000.",
      guide: {
        meaning:
          "How steady your glucose is, from the Sugar log. MP in this window is Control. Insulin dose is recorded as context — more insulin is not a higher score.",
        research:
          "ADA-style adult targets often cited: roughly 80–130 mg/dL before meals and under 180 mg/dL 1–2 hours after. This app is stricter on the “in range” badge (before: 70–99, after: 70–139) so the score stays honest. Hypos (<70) also cost Control.",
        target:
          "Gold week: readings on ≥5 days, ≥70% in range, few highs or lows. Path to 1000: most days measured for 90 days with a high in-range share.",
        compare: [
          compare("Readings this week", sugarWeek.length, 7),
          compare("Days measured this week", sugarDaysWeek, 5),
          compare("In-range this week", sugarWeek.length ? Math.round(inRangeRatio * 100) : null, 70, "%"),
          compare("Days measured in 30d", sugarDaysMonth, 24),
          compare("Days measured in 90d", sugarDaysQuarter, 70),
        ],
        steps: [
          "Log before-meal and after-meal when you can — both teach Control.",
          "If a reading is high, do not skip the next log. The trend is the stat.",
          "Meals (Discipline/Nourish), sleep (Vitality), and walks (Endurance) are the usual levers — Control is the result, not a separate gym.",
          "This is not medical advice. Use your clinician’s targets if they differ; the window scores the ranges already built into Sugar.",
        ],
        next:
          sugarWeek.length === 0
            ? "Log one reading today to awaken Control."
            : "Log the next planned meal’s before or after reading.",
      },
    },
  ];

  for (const stat of stats) {
    stat.delta = trendDelta(stat.value, stat.previous);
    stat.trend = stat.delta > 15 ? "up" : stat.delta < -15 ? "down" : "stable";
    stat.grade = gradeFromValue(stat.value);
    stat.pct = clamp((stat.value / STAT_MAX) * 100, 0, 100);
  }

  const values = stats.map((s) => s.value);
  const level = clamp(avg(values) || 0);
  const rank = rankFromLevel(level);
  const klass = heroClass(stats, level);
  const prevLevel = clamp(avg(stats.map((s) => s.previous || 0)) || 0);
  const strongest = [...stats].sort((a, b) => b.value - a.value)[0];
  const weakest = [...stats].sort((a, b) => a.value - b.value)[0];
  const awakened = level > 0;

  const effects = [];
  if (!awakened) {
    effects.push({
      kind: "neutral",
      name: "Blank Slate",
      detail: "Every attribute is 0. Log one action, then tap that stat to see the path to 1000.",
    });
  } else {
    if (streak >= 7) {
      effects.push({
        kind: "buff",
        name: "Unbroken Flame",
        detail: `${streak}-day movement streak`,
      });
    } else if (streak >= 3) {
      effects.push({
        kind: "buff",
        name: "Kindled",
        detail: `${streak}-day streak`,
      });
    } else if (endIdle != null && endIdle > 3) {
      effects.push({
        kind: "debuff",
        name: "Rust",
        detail: "No movement for more than 3 days",
      });
    }
    if (vit >= 500) {
      effects.push({ kind: "buff", name: "Deep Rest", detail: "Sleep is restoring you" });
    } else if (vit > 0 && vit < 120) {
      effects.push({ kind: "debuff", name: "Fatigue", detail: "Vitality is low — protect a 7–9h night" });
    }
    if (str >= 500) {
      effects.push({ kind: "buff", name: "Iron Body", detail: "Lifting consistency is landing" });
    }
    if (dis >= 500) {
      effects.push({ kind: "buff", name: "Oathbound", detail: "Meals are on plan" });
    } else if (foodWeek.logged && foodWeek.adherence < 50) {
      effects.push({
        kind: "debuff",
        name: "Broken Fast",
        detail: "More meals skipped than kept",
      });
    }
    if (ctl >= 500) {
      effects.push({ kind: "buff", name: "Steady Pulse", detail: "Glucose mostly in range" });
    } else if (highWeek >= 3) {
      effects.push({
        kind: "debuff",
        name: "Sugar Storm",
        detail: `${highWeek} high or elevated readings this week`,
      });
    }
    if (stats.filter((s) => s.decaying).length >= 3) {
      effects.push({
        kind: "debuff",
        name: "Idle Curse",
        detail: "Several awakened stats are decaying",
      });
    }
  }

  const quests = [];
  const sorted = [...stats].sort((a, b) => a.value - b.value);
  for (const stat of sorted) {
    if (quests.length >= 3) break;
    quests.push({
      id: stat.id,
      tag: stat.label,
      color: stat.color,
      title: stat.questTitle,
      detail: stat.quest,
      href: stat.href,
      progress: stat.pct,
    });
  }

  return {
    statMax: STAT_MAX,
    level,
    previousLevel: prevLevel,
    levelDelta: level - prevLevel,
    rank,
    class: klass,
    awakened,
    hp: {
      current: vit,
      max: STAT_MAX,
      label: "HP",
      hint: "Vitality · 7–9h sleep",
    },
    mp: {
      current: ctl,
      max: STAT_MAX,
      label: "MP",
      hint: "Control · glucose in range",
    },
    strongest: awakened
      ? { id: strongest.id, name: strongest.name, value: strongest.value }
      : null,
    weakest: { id: weakest.id, name: weakest.name, value: weakest.value },
    stats,
    effects: effects.slice(0, 6),
    quests,
    summary: {
      exerciseStreak: streak,
      weekExerciseMinutes: totalWeekMin,
      sleepNights: sleepWeekLogs.length,
      sugarReadings: sugarWeek.length,
      foodAdherence: foodWeek.logged ? Math.round(foodWeek.adherence) : null,
    },
    computedAt: now.toISOString(),
  };
}
