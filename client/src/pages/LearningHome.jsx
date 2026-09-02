import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  advanceStudyTopic,
  getReviewQueue,
  getStudyPlan,
  logStudyBlock,
  peekReviewQueue,
  peekStudyPlan,
  updateStudySettings,
} from "../api.js";
import StudyPlanChart, { StudySubjectBars } from "../components/StudyPlanChart.jsx";
import { difficultyMeta } from "../difficulty.js";
import { todayKey } from "../food.js";
import { notebookPath, reviewItemHint } from "../lib/today.js";
import { accentMap } from "../theme.jsx";

const WEEKDAY_EDIT = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_NAMES = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function subjectId(value) {
  return String(value?._id || value || "");
}

function lineupLabel(day, short = false) {
  const list = day?.lineup || [];
  if (!list.length) return short ? "Set mix" : "Pick today's subjects";
  return list
    .map((item) => (short ? item.shortName : item.name))
    .join(short ? " · " : " + ");
}

function padSubjects(list, slots) {
  const ids = (list || []).map(subjectId).filter(Boolean).slice(0, slots);
  while (ids.length < slots) ids.push("");
  return ids;
}

function rotationSubjects(rotation, weekday) {
  const row = (rotation || []).find((item) => Number(item.weekday) === weekday);
  return (row?.subjects || []).map(subjectId);
}

function statusLabel(status) {
  if (status === "done") return "Done";
  if (status === "skipped") return "Skipped";
  return "Not yet";
}

function groupBlocks(blocks) {
  const groups = [];
  const index = {};
  for (const block of blocks || []) {
    const sid = subjectId(block.subject) || block.id;
    if (index[sid] == null) {
      index[sid] = groups.length;
      groups.push({
        id: sid,
        subject: block.subject,
        blocks: [],
      });
    }
    groups[index[sid]].blocks.push(block);
  }
  return groups;
}

export default function LearningHome() {
  const { subjects } = useOutletContext();
  const [plan, setPlan] = useState(() => peekStudyPlan() || null);
  const [review, setReview] = useState(() => peekReviewQueue() || []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [selectedKey, setSelectedKey] = useState(() => todayKey());
  const [editing, setEditing] = useState(false);
  const [draftSlots, setDraftSlots] = useState(2);
  const [draft, setDraft] = useState([]);

  const totals = subjects.reduce(
    (acc, s) => {
      acc.theory += s.stats?.theory?.mainTopics || 0;
      acc.practical += s.stats?.practical?.mainTopics || 0;
      acc.inReview += s.stats?.inReview || 0;
      return acc;
    },
    { theory: 0, practical: 0, inReview: 0 }
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStudyPlan(), getReviewQueue()])
      .then(([nextPlan, nextReview]) => {
        if (cancelled) return;
        setPlan(nextPlan);
        setReview(nextReview || []);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = plan?.today;
  const selected =
    plan?.days?.find((day) => day.key === selectedKey) || today || null;
  const remaining =
    today?.blocks?.filter((block) => block.status !== "done").length || 0;
  const practicalLag =
    (plan?.balance?.theory || 0) > (plan?.balance?.practical || 0) + 1;
  const slots = plan?.settings?.slotsPerDay || 2;
  const groups = useMemo(
    () => groupBlocks(selected?.blocks || []),
    [selected]
  );
  const neglected = useMemo(() => {
    const list = plan?.neglected || [];
    const started = list.some((item) => item.lastDone);
    return list.filter((item) => {
      if (item.inWeek) return false;
      if (item.daysAgo != null && item.daysAgo >= 8) return true;
      return started && item.lastDone == null;
    });
  }, [plan]);

  function buildDraft(nextSlots = slots) {
    const rotation = plan?.settings?.rotation || [];
    return WEEKDAY_EDIT.map((weekday) => ({
      weekday,
      subjects: padSubjects(rotationSubjects(rotation, weekday), nextSlots),
    }));
  }

  function startEdit() {
    setDraftSlots(slots);
    setDraft(buildDraft(slots));
    setEditing(true);
  }

  async function saveSettings(payload) {
    setBusy("settings");
    try {
      const next = await updateStudySettings(payload);
      setPlan(next);
      setError("");
      return next;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy("");
    }
  }

  async function saveDayMix(weekday, subjectIds, nextSlots = slots) {
    const saved = await saveSettings({
      slotsPerDay: nextSlots,
      rotation: [{ weekday, subjects: subjectIds.filter(Boolean) }],
    });
    if (saved && editing) {
      setDraft(
        WEEKDAY_EDIT.map((day) => ({
          weekday: day,
          subjects: padSubjects(
            rotationSubjects(saved.settings?.rotation, day),
            nextSlots
          ),
        }))
      );
    }
  }

  async function saveRotation() {
    const saved = await saveSettings({
      slotsPerDay: draftSlots,
      rotation: draft.map((row) => ({
        weekday: row.weekday,
        subjects: row.subjects.filter(Boolean),
      })),
    });
    if (saved) setEditing(false);
  }

  async function applyMixToWeek() {
    const mix = (selected?.lineup || []).map((item) => item._id);
    if (!mix.length) {
      setError("Pick this day's subjects first, then copy them to the week.");
      return;
    }
    const saved = await saveSettings({
      slotsPerDay: slots,
      applyToWeek: true,
      subjects: mix,
    });
    if (saved && editing) {
      setDraft(buildDraft(slots));
      setDraftSlots(saved.settings?.slotsPerDay || slots);
    }
  }

  async function changeSlots(nextSlots) {
    if (editing) {
      setDraftSlots(nextSlots);
      setDraft((rows) =>
        rows.map((row) => ({
          ...row,
          subjects: padSubjects(row.subjects, nextSlots),
        }))
      );
      return;
    }
    await saveSettings({
      slotsPerDay: nextSlots,
      rotation: (plan?.settings?.rotation || []).map((row) => ({
        weekday: row.weekday,
        subjects: (row.subjects || []).slice(0, nextSlots),
      })),
    });
  }

  async function changeSelectedSlot(index, value) {
    const current = padSubjects(
      (selected?.lineup || []).map((item) => item._id),
      slots
    );
    current[index] = value;
    const unique = [];
    for (const id of current) {
      if (id && unique.includes(id)) continue;
      unique.push(id);
    }
    await saveDayMix(selected.weekday, unique.filter(Boolean));
  }

  async function markBlock(block, status) {
    if (!selected) return;
    setBusy(`${block.id}-${status}`);
    try {
      const next = await logStudyBlock({
        day: selected.key,
        kind: block.kind,
        status,
        subject: block.subject?._id || null,
        topic: block.topic?._id || null,
      });
      setPlan(next);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function moveOn(block) {
    if (!block.subject?._id) return;
    setBusy(`${block.id}-next`);
    try {
      const next = await advanceStudyTopic({
        subject: block.subject._id,
        kind: block.kind,
        topic: block.topic?._id || null,
      });
      setPlan(next);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const selectedPicks = padSubjects(
    (selected?.lineup || []).map((item) => item._id),
    slots
  );

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad">
        <p className="text-[12px] tracking-[0.18em] text-teal uppercase">
          Learning · Plan
        </p>
        <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">
          Your mix, then stick to it
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Pick two or three subjects for the day. Each one still needs theory
          and practical — you choose the languages, not a preset rotation.
        </p>

        {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Today"
            value={
              today?.blocks?.length
                ? `${Math.max(today.blocks.length - remaining, 0)} / ${today.blocks.length}`
                : "—"
            }
            hint={
              today?.blocks?.length
                ? remaining
                  ? `${remaining} session${remaining === 1 ? "" : "s"} left`
                  : "all sessions done"
                : "set today's mix"
            }
          />
          <StatCard
            label="Streak"
            value={plan?.streak ?? 0}
            hint="days the full mix was done"
          />
          <StatCard
            label="This week"
            value={`${plan?.balance?.theory || 0} · ${plan?.balance?.practical || 0}`}
            hint={practicalLag ? "practical is behind" : "theory · practical"}
          />
          <StatCard
            label="Review"
            value={review.length}
            hint="in the queue"
          />
          <StatCard
            label="30 days"
            value={
              plan?.history?.planned30
                ? `${plan.history.complete30} / ${plan.history.planned30}`
                : "—"
            }
            hint="complete mix days"
          />
        </div>

        <div
          id="jump-statistics"
          data-jump="Statistics"
          className="mt-8 rounded-2xl border border-line bg-[#222838]/80 p-5"
        >
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            Statistics
          </p>
          <h3 className="mt-1 text-lg font-semibold">Last 30 days</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Sessions marked done each day, plus a per-subject split of theory
            versus practical. Hover a bar to see the language and topic.
          </p>
          <div className="mt-4">
            <StudyPlanChart
              historyDays={plan?.history?.days || []}
              dayCount={30}
              selectedKey={selected?.key}
              weekKeys={(plan?.days || []).map((day) => day.key)}
              onSelectDay={setSelectedKey}
            />
          </div>
          <StudySubjectBars bySubject={plan?.history?.bySubject || []} />
        </div>

        <div className="mt-8">
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            This week
          </p>
          <div className="mt-3 -mx-1 overflow-x-auto pb-1">
            <div className="grid min-w-[32rem] grid-cols-7 gap-1.5 sm:gap-2 md:min-w-0">
            {(plan?.days || []).map((day) => {
              const active = day.key === selected?.key;
              const isToday = day.key === today?.key;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedKey(day.key)}
                  className={`rounded-2xl border px-1 py-2.5 text-center sm:px-2 ${
                    active
                      ? "border-teal/50 bg-teal/12 ring-1 ring-teal/30"
                      : "border-line bg-[#222838]/80 hover:border-white/15"
                  }`}
                >
                  <p className="text-[10px] tracking-wide text-muted uppercase">
                    {day.weekdayLabel}
                  </p>
                  <p className="mt-1 truncate text-[11px] font-medium sm:text-xs">
                    {lineupLabel(day, true)}
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${
                      day.complete
                        ? "text-teal"
                        : isToday
                          ? "text-gold"
                          : "text-muted"
                    }`}
                  >
                    {day.complete ? "Done" : isToday ? "Today" : statusDots(day)}
                  </p>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {plan?.tomorrow && selected?.key === today?.key ? (
          <p className="mt-4 text-sm text-muted">
            Tomorrow is already set:{" "}
            <span className="text-ink">
              {plan.tomorrow.weekdayLabel} · {lineupLabel(plan.tomorrow)}
            </span>. Change it below if you want a different mix.
          </p>
        ) : null}

        <div id="jump-today-mix" data-jump="Today mix" className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
                {selected?.key === today?.key
                  ? "Today"
                  : selected?.weekdayLabel || "Day"}
              </p>
              <h3 className="mt-1 text-xl font-semibold">
                {lineupLabel(selected)}
              </h3>
              <p className="mt-1 text-sm text-muted">
                For each subject: theory first, then type the practical.
              </p>
            </div>
            <button
              type="button"
              onClick={editing ? () => setEditing(false) : startEdit}
              className="text-sm text-teal hover:underline"
            >
              {editing ? "Close editor" : "Edit whole week"}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-[#222838]/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-2 text-xs text-muted">Subjects a day</p>
              {[2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => changeSlots(n)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    (editing ? draftSlots : slots) === n
                      ? "border-teal/50 bg-teal/12 text-ink"
                      : "border-line text-muted hover:border-white/15"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {!editing ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedPicks.map((value, index) => (
                    <label key={`${selected?.key || "day"}-${index}`} className="block text-sm">
                      <span className="text-xs text-muted">
                        Subject {index + 1}
                      </span>
                      <select
                        value={value}
                        disabled={Boolean(busy)}
                        onChange={(e) =>
                          changeSelectedSlot(index, e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-line bg-[#171c2a] px-3 py-2.5 text-sm outline-none focus:border-teal/50"
                      >
                        <option value="">Pick a subject</option>
                        {subjects.map((subject) => (
                          <option
                            key={subject._id}
                            value={subject._id}
                            disabled={
                              selectedPicks.includes(subject._id) &&
                              subject._id !== value
                            }
                          >
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={Boolean(busy) || !selected?.lineup?.length}
                  onClick={applyMixToWeek}
                  className="mt-4 text-sm text-teal hover:underline disabled:text-muted"
                >
                  Use this mix every day
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-muted">
                  Set each weekday yourself. Empty slots stay empty until you
                  pick something.
                </p>
                <div className="mt-4 space-y-4">
                  {draft.map((row, rowIndex) => (
                    <div key={row.weekday}>
                      <p className="text-xs text-muted">
                        {WEEKDAY_NAMES[row.weekday]}
                      </p>
                      <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {padSubjects(row.subjects, draftSlots).map(
                          (value, index) => (
                            <select
                              key={`${row.weekday}-${index}`}
                              value={value}
                              onChange={(e) => {
                                const next = draft.map((item) => ({
                                  ...item,
                                  subjects: [...item.subjects],
                                }));
                                next[rowIndex].subjects = padSubjects(
                                  next[rowIndex].subjects,
                                  draftSlots
                                );
                                next[rowIndex].subjects[index] = e.target.value;
                                setDraft(next);
                              }}
                              className="w-full rounded-xl border border-line bg-[#171c2a] px-3 py-2.5 text-sm outline-none focus:border-teal/50"
                            >
                              <option value="">Pick a subject</option>
                              {subjects.map((subject) => (
                                <option
                                  key={subject._id}
                                  value={subject._id}
                                  disabled={
                                    row.subjects.includes(subject._id) &&
                                    subject._id !== value
                                  }
                                >
                                  {subject.name}
                                </option>
                              ))}
                            </select>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={busy === "settings"}
                  onClick={saveRotation}
                  className="mt-4 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-[#0b1f1c]"
                >
                  {busy === "settings" ? "Saving…" : "Save week"}
                </button>
              </>
            )}
          </div>

          <div className="mt-4 space-y-6">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="mb-2 text-sm font-medium">
                  {group.subject?.name || "Subject"}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.blocks.map((block) => (
                    <SessionCard
                      key={block.id}
                      block={block}
                      busy={busy}
                      onMark={markBlock}
                      onNext={moveOn}
                    />
                  ))}
                </div>
              </div>
            ))}
            {!groups.length ? (
              <p className="text-sm text-muted">
                Pick {slots} subjects above. Today won&apos;t start until you
                set the mix.
              </p>
            ) : null}
          </div>
        </div>

        <StudyJournal
          history={plan?.history}
          weekKeys={(plan?.days || []).map((day) => day.key)}
          selectedKey={selected?.key}
          onSelectDay={setSelectedKey}
        />

        {neglected.length ? (
          <div className="mt-8 rounded-2xl border border-line bg-[#222838]/80 p-4">
            <p className="text-[12px] tracking-[0.18em] text-gold uppercase">
              Not in this week
            </p>
            <p className="mt-1 text-sm text-muted">
              These are not in your mix. Add one to a day if you don&apos;t want
              them to go quiet.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {neglected.map((item) => (
                <li
                  key={item._id}
                  className="rounded-full border border-line bg-white/4 px-3 py-1 text-xs"
                >
                  {item.shortName}
                  {item.daysAgo == null ? " · never" : ` · ${item.daysAgo}d`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {review.length ? (
          <div id="jump-review" data-jump="Review" className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
                  Review
                </p>
                <h3 className="mt-1 text-xl font-semibold">In your queue</h3>
              </div>
              <span className="text-xs text-teal">{review.length} items</span>
            </div>
            <ul className="mt-4 space-y-2">
              {review.slice(0, 6).map((item) => (
                <li key={item._id}>
                  <Link
                    to={notebookPath(item)}
                    className="flex flex-wrap items-start gap-3 rounded-2xl border border-line bg-[#222838]/80 px-4 py-3 transition hover:border-white/15 sm:items-center"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-medium">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted">
                        {item.subject?.shortName || item.subject?.name} ·{" "}
                        {reviewItemHint(item)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
                        difficultyMeta(item.difficulty).className
                      }`}
                    >
                      {difficultyMeta(item.difficulty).label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div id="jump-subjects" data-jump="Subjects" className="mt-10">
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            Library
          </p>
          <h3 className="mt-1 text-xl font-semibold">Subjects</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Browse when you need a topic. Daily work still comes from the mix
            above.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {subjects.map((subject) => {
              const accent = accentMap[subject.accent] || accentMap.teal;
              return (
                <Link
                  key={subject.slug}
                  to={`/learning/${subject.slug}`}
                  className={`rounded-2xl border border-line bg-[#222838]/80 p-5 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:border-white/15 ${accent.glow}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${accent.text}`}>
                        {subject.shortName}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold break-words">
                        {subject.name}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-lg bg-white/6 px-2 py-1 text-xs">
                      Theory · Practical
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {subject.description}
                  </p>
                  <p className="mt-4 text-xs text-muted">
                    Theory {subject.stats?.theory?.mainTopics ?? 0} · Practical{" "}
                    {subject.stats?.practical?.mainTopics ?? 0}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="page-aside">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          How to use this
        </p>
        <h3 className="mt-2 text-lg font-semibold">You pick the mix</h3>
        <ol className="mt-6 space-y-4 text-sm leading-6 text-muted">
          <li>
            <span className="text-ink">1. Choose 2 or 3 subjects.</span> Not
            the whole library — only what you will actually open today.
          </li>
          <li>
            <span className="text-ink">2. Set the week once.</span> Copy
            today&apos;s mix to every day, or give Tuesday a different pair.
          </li>
          <li>
            <span className="text-ink">3. Theory then practical</span> for each
            language. That is how practical stops getting skipped.
          </li>
          <li>
            <span className="text-ink">4. Don&apos;t reshuffle at 11pm.</span>{" "}
            Change the mix when you plan, not when you feel bored mid-session.
          </li>
        </ol>
        <div className="mt-8 space-y-5">
          <Stat label="Theory topics" value={totals.theory} />
          <Stat label="Practical topics" value={totals.practical} teal />
          <Stat label="In review" value={totals.inReview} teal />
        </div>
      </aside>
    </div>
  );
}

function statusDots(day) {
  const done = day.blocks.filter((block) => block.status === "done").length;
  if (!day.blocks.length) return "—";
  return `${done}/${day.blocks.length}`;
}

function formatJournalDay(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  if (!y) return key;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function sessionText(snap) {
  if (!snap || snap.status === "open") return "—";
  const title = snap.topic?.title;
  if (snap.status === "skipped") return title ? `Skipped · ${title}` : "Skipped";
  return title || "Done";
}

function StudyJournal({ history, weekKeys, selectedKey, onSelectDay }) {
  const days = history?.days || [];
  const loggedDays = days.filter((day) =>
    day.groups.some(
      (group) =>
        group.theory?.status !== "open" || group.practical?.status !== "open"
    )
  );
  const weekSet = new Set(weekKeys || []);

  if (!loggedDays.length) {
    return (
      <div className="mt-8">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          What you studied
        </p>
        <h3 className="mt-1 text-xl font-semibold">By day and topic</h3>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Mark Done on a session and this list will show the language and the
          topic for that day. The chart above still fills in as you go.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
        What you studied
      </p>
      <h3 className="mt-1 text-xl font-semibold">By day and topic</h3>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Hover a bar in Statistics for the same detail. Click a day from this
        week to open it in the mix above.
      </p>

      <ul className="mt-4 space-y-2">
        {loggedDays.map((day) => {
          const inWeek = weekSet.has(day.key);
          return (
            <li key={day.key}>
              <button
                type="button"
                onClick={() => {
                  if (inWeek) onSelectDay(day.key);
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${
                  selectedKey === day.key
                    ? "border-teal/50 bg-teal/10"
                    : "border-line bg-[#222838]/80"
                } ${inWeek ? "hover:border-white/15" : ""}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {formatJournalDay(day.key)}
                  </p>
                  <p
                    className={`text-[11px] ${
                      day.complete ? "text-teal" : "text-muted"
                    }`}
                  >
                    {day.complete
                      ? "Mix complete"
                      : day.groups.some(
                          (group) =>
                            group.theory?.status !== "open" ||
                            group.practical?.status !== "open"
                        )
                        ? "Partial"
                        : "Not logged"}
                  </p>
                </div>
                <ul className="mt-2 space-y-1">
                  {day.groups.map((group) => (
                    <li
                      key={group.subject?._id || group.subject?.slug}
                      className="text-sm"
                    >
                      <span className="text-ink">
                        {group.subject?.name || "Subject"}
                      </span>
                      <span className="text-muted">
                        {" "}
                        · Theory {sessionText(group.theory)} · Practical{" "}
                        {sessionText(group.practical)}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SessionCard({ block, busy, onMark, onNext }) {
  const accent = accentMap[block.subject?.accent] || accentMap.teal;
  const open = block.status === "open";
  return (
    <article className="rounded-2xl border border-line bg-[#222838]/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-medium ${accent.text}`}>{block.label}</p>
          <h4 className="mt-1 text-lg font-semibold break-words">
            {block.topic?.title || "No topic yet — add one in the library"}
          </h4>
          {block.topic?.parentTitle ? (
            <p className="mt-1 text-xs text-muted">{block.topic.parentTitle}</p>
          ) : block.topic?.slNo ? (
            <p className="mt-1 text-xs text-muted">Topic {block.topic.slNo}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
            block.status === "done"
              ? "border-teal/40 text-teal"
              : block.status === "skipped"
                ? "border-gold/40 text-gold"
                : "border-line text-muted"
          }`}
        >
          {statusLabel(block.status)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={block.href}
          className="rounded-xl bg-teal px-3 py-2 text-sm font-semibold text-[#0b1f1c]"
        >
          Open
        </Link>
        {open ? (
          <>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => onMark(block, "done")}
              className="rounded-xl border border-line px-3 py-2 text-sm hover:border-teal/40"
            >
              Done
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => onMark(block, "skipped")}
              className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:border-white/15"
            >
              Skip
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => onMark(block, "open")}
            className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:border-white/15"
          >
            Undo
          </button>
        )}
        {block.kind !== "review" && block.topic?._id ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => onNext(block)}
            className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:border-white/15"
          >
            Next topic
          </button>
        ) : null}
      </div>
    </article>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-[#222838]/80 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Stat({ label, value, teal }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={teal ? "text-teal" : ""}>{value}</span>
    </div>
  );
}
