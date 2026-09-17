import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  createPlanItem,
  deletePlanItem,
  getLearningPlan,
  peekLearningPlan,
  updatePlanItem,
} from "../api.js";
import PlanItemFormModal, {
  PlanProgressLine,
  PlanRowActions,
} from "../components/PlanItemFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { todayKey } from "../food.js";
import {
  formatPlanDate,
  groupPlanByLanguage,
  PLAN_PRIORITY_META,
  topicLearned,
} from "../lib/planItems.js";
import { accentMap } from "../theme.jsx";

export default function LearningHome() {
  const { subjects } = useOutletContext();
  const [plan, setPlan] = useState(() => peekLearningPlan() || null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function load() {
    const data = await getLearningPlan();
    setPlan(data);
    setError("");
  }

  useEffect(() => {
    let live = true;
    getLearningPlan()
      .then((data) => {
        if (!live) return;
        setPlan(data);
        setError("");
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, []);

  const cards = plan?.subjects?.length
    ? plan.subjects
    : subjects.map((subject) => ({
        ...subject,
        total: 0,
        learned: 0,
        remaining: 0,
        segments: [],
      }));

  const due = plan?.today || [];
  const studied = cards.reduce((sum, card) => sum + (card.learned || 0), 0);
  const planned = cards.reduce((sum, card) => sum + (card.total || 0), 0);

  return (
    <div className="grid min-h-screen min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="page-pad">
        <p className="text-[12px] tracking-[0.18em] text-teal uppercase">
          Learning · Plan
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold break-words sm:text-3xl">
              Topics you mean to study
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Add a subject, topic, date, and priority. Open a language to tick
              what you have learned — the line on each card fills as you go.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e]"
          >
            Add topic
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Planned"
            value={planned}
            hint="main topics on the plan"
          />
          <StatCard
            label="Studied"
            value={studied}
            hint="ticked off on a language"
          />
          <StatCard
            label="Due"
            value={due.length}
            hint="today or overdue, still open"
          />
        </div>

        <div id="jump-languages" data-jump="Languages" className="mt-8">
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            Languages
          </p>
          <h3 className="mt-1 text-xl font-semibold">Open a subject</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {cards.map((subject) => {
              const accent = accentMap[subject.accent] || accentMap.teal;
              return (
                <Link
                  key={subject.slug}
                  to={`/learning/plan/${subject.slug}`}
                  className={`rounded-2xl border border-line bg-raised/80 p-5 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:border-white/15 ${accent.glow}`}
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
                      {subject.total
                        ? `${subject.learned} / ${subject.total}`
                        : "Empty"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {subject.description || "Add topics for this language."}
                  </p>
                  <div className="mt-4">
                    <PlanProgressLine
                      segments={subject.segments}
                      accentClass={accent.bar}
                    />
                    <p className="mt-2 text-xs text-muted">
                      {subject.total
                        ? subject.remaining
                          ? `${subject.remaining} left to study`
                          : "All planned topics studied"
                        : "No topics yet"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="page-aside xl:sticky xl:top-0 xl:max-h-screen xl:overflow-y-auto">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          By language
        </p>
        <h3 className="mt-2 text-lg font-semibold">Plan topics</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          Soonest dates first. Finished topics drop to the bottom.
        </p>
        <LanguagePlanList
          subjects={cards}
          items={plan?.items || []}
          onEdit={(item) => setModal({ type: "edit", item })}
          onDelete={(item) => setConfirm(item)}
        />
      </aside>

      {modal ? (
        <PlanItemFormModal
          subjects={subjects}
          initial={
            modal.type === "edit"
              ? modal.item
              : undefined
          }
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal.type === "edit") {
              await updatePlanItem(modal.item._id, payload);
            } else {
              await createPlanItem(payload);
            }
            await load();
          }}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={`Delete “${confirm.title}”?`}
          message={
            confirm.children?.length
              ? "This also removes its subtopics."
              : "This topic will leave the plan."
          }
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await deletePlanItem(confirm._id);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function dateUrgency(date, today) {
  const key = String(date || "").slice(0, 10);
  if (!key) return { label: "", className: "text-muted" };
  if (key < today) return { label: "Overdue", className: "text-coral" };
  if (key === today) return { label: "Today", className: "text-gold" };
  return { label: formatPlanDate(key), className: "text-muted" };
}

function LanguagePlanList({ subjects, items, onEdit, onDelete }) {
  const groups = useMemo(
    () => groupPlanByLanguage(items, subjects),
    [items, subjects]
  );
  const [open, setOpen] = useState({});

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      for (const group of groups) {
        const slug = group.subject.slug;
        if (next[slug] == null) {
          next[slug] = group.topics.length > 0 && !group.finished;
        }
      }
      return next;
    });
  }, [groups]);

  if (!groups.length) {
    return (
      <p className="mt-6 text-sm text-muted">
        Add a topic and it will land here under its language.
      </p>
    );
  }

  const today = todayKey();

  return (
    <div className="mt-6 space-y-2">
      {groups.map((group) => {
        const slug = group.subject.slug;
        const expanded = Boolean(open[slug]);
        const accent = accentMap[group.subject.accent] || accentMap.teal;
        return (
          <div
            key={slug}
            className="rounded-2xl border border-line bg-raised/80"
          >
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() =>
                setOpen((prev) => ({ ...prev, [slug]: !prev[slug] }))
              }
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            >
              <span className={`min-w-0 flex-1 truncate text-sm font-medium ${accent.text}`}>
                {group.subject.shortName || group.subject.name}
              </span>
              <span className="shrink-0 text-[11px] text-muted">
                {!group.topics.length
                  ? "None"
                  : group.finished
                    ? "Done"
                    : `${group.openCount} open`}
              </span>
              <svg
                viewBox="0 0 16 16"
                className={`h-3.5 w-3.5 shrink-0 text-muted transition ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3.5 6 8 10.5 12.5 6" />
              </svg>
            </button>
            {expanded ? (
              group.topics.length ? (
              <ul className="space-y-2 border-t border-line px-3 py-3">
                {group.topics.map((item) => {
                  const done = topicLearned(item);
                  const urgency = dateUrgency(item.date, today);
                  const priority =
                    PLAN_PRIORITY_META[item.priority] ||
                    PLAN_PRIORITY_META.medium;
                  return (
                    <li key={item._id}>
                      <Link
                        to={`/learning/plan/${slug}`}
                        className={`block text-sm leading-5 ${
                          done ? "text-muted line-through" : "text-ink"
                        }`}
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={urgency.className}>
                          {urgency.label}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-px ${priority.className}`}
                        >
                          {priority.label}
                        </span>
                      </p>
                      <div className="mt-1.5">
                        <PlanRowActions
                          compact
                          onEdit={() => onEdit(item)}
                          onDelete={() => onDelete(item)}
                        />
                      </div>
                      {item.children?.length ? (
                        <ul className="mt-1.5 space-y-1.5 border-l border-line pl-2">
                          {item.children.map((child) => {
                            const childDone = topicLearned(child);
                            const childUrgency = dateUrgency(
                              child.date,
                              today
                            );
                            return (
                              <li key={child._id}>
                                <p
                                  className={`text-[12px] ${
                                    childDone
                                      ? "text-muted line-through"
                                      : "text-ink"
                                  }`}
                                >
                                  {child.title}
                                  <span
                                    className={`ml-1.5 text-[10px] ${childUrgency.className}`}
                                  >
                                    {childUrgency.label}
                                  </span>
                                </p>
                                <PlanRowActions
                                  compact
                                  onEdit={() => onEdit(child)}
                                  onDelete={() => onDelete(child)}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              ) : (
                <p className="border-t border-line px-3 py-3 text-xs text-muted">
                  No topics on this language yet.
                </p>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-raised/80 px-4 py-4">
      <p className="text-[11px] tracking-[0.16em] text-muted uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
