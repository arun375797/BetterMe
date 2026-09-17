import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router-dom";
import {
  createPlanItem,
  deletePlanItem,
  getPlanSubject,
  peekPlanSubject,
  updatePlanItem,
} from "../api.js";
import PlanItemFormModal, {
  PlanProgressLine,
  PlanRowActions,
} from "../components/PlanItemFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import {
  formatPlanDate,
  nestPlanItems,
  PLAN_PRIORITY_META,
  topicLearned,
} from "../lib/planItems.js";
import { accentMap } from "../theme.jsx";

export default function PlanSubjectPage() {
  const { slug } = useParams();
  const { subjects } = useOutletContext();
  const [data, setData] = useState(() => peekPlanSubject(slug) || null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const subject =
    data?.subject || subjects.find((item) => item.slug === slug) || null;

  async function load() {
    const next = await getPlanSubject(slug);
    setData(next);
    setError("");
  }

  useEffect(() => {
    const cached = peekPlanSubject(slug);
    if (cached) setData(cached);
    else setData(null);
    let live = true;
    getPlanSubject(slug)
      .then((next) => {
        if (!live) return;
        setData(next);
        setError("");
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [slug]);

  const tree = useMemo(() => nestPlanItems(data?.items || []), [data]);

  if (!subject && error) {
    return (
      <div className="page-pad">
        <p className="text-sm text-coral">{error}</p>
        <Link to="/learning" className="mt-3 inline-block text-sm text-teal">
          Back to plan
        </Link>
      </div>
    );
  }
  if (!subject && !subjects.length) {
    return <p className="page-pad text-muted">Loading…</p>;
  }
  if (!subject) {
    return <Navigate to="/learning" replace />;
  }

  const accent = accentMap[subject.accent] || accentMap.teal;
  const card = data?.card;

  async function toggleItem(item, learned) {
    setBusy(item._id);
    try {
      await updatePlanItem(item._id, { learned });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="page-pad mx-auto max-w-3xl">
      <p className="text-[12px] tracking-[0.18em] text-teal uppercase">
        <Link to="/learning" className="hover:underline">
          Plan
        </Link>
        {" · "}
        {subject.shortName}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold break-words sm:text-3xl">
            {subject.name}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Tick a topic when it is learned. Subtopics are optional — if they
            exist, the parent fills when every child is done.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "topic" })}
          className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e]"
        >
          Add topic
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      <div className="mt-6 rounded-2xl border border-line bg-raised/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className={`text-xs font-medium ${accent.text}`}>Studied</p>
          <p className="text-xs text-muted">
            {card?.total
              ? `${card.learned} / ${card.total}`
              : "No topics yet"}
          </p>
        </div>
        <div className="mt-3">
          <PlanProgressLine
            segments={card?.segments || []}
            accentClass={accent.bar}
          />
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {tree.length ? (
          tree.map((item) => (
            <PlanTopicCard
              key={item._id}
              item={item}
              busy={busy}
              onToggle={toggleItem}
              onEdit={(row) => setModal({ type: "edit", item: row })}
              onSubtopic={(row) => setModal({ type: "sub", parent: row })}
              onDelete={(row) => setConfirm(row)}
            />
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            No topics on this language yet. Add one with a date and priority.
          </li>
        )}
      </ul>

      {modal ? (
        <PlanItemFormModal
          subjects={subjects}
          lockSubject
          parentTitle={
            modal.type === "sub" ? modal.parent?.title : ""
          }
          initial={
            modal.type === "edit"
              ? {
                  ...modal.item,
                  subject: subject._id,
                }
              : { subject: subject._id }
          }
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal.type === "edit") {
              await updatePlanItem(modal.item._id, payload);
            } else if (modal.type === "sub") {
              await createPlanItem({
                ...payload,
                subject: subject._id,
                parent: modal.parent._id,
              });
            } else {
              await createPlanItem({ ...payload, subject: subject._id });
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

function PlanTopicCard({
  item,
  busy,
  onToggle,
  onEdit,
  onSubtopic,
  onDelete,
}) {
  const done = topicLearned(item);
  const priority = PLAN_PRIORITY_META[item.priority] || PLAN_PRIORITY_META.medium;
  const disabled = Boolean(busy);

  return (
    <li className="rounded-2xl border border-line bg-raised/80 p-4">
      <div className="flex items-start gap-3">
        <TickBox
          checked={done}
          disabled={disabled}
          onClick={() => onToggle(item, !done)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p
              className={`font-medium break-words ${
                done ? "text-muted line-through" : ""
              }`}
            >
              {item.title}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${priority.className}`}
            >
              {priority.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{formatPlanDate(item.date)}</p>
          <div className="mt-3">
            <PlanRowActions
              disabled={disabled}
              onSubtopic={() => onSubtopic(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          </div>
        </div>
      </div>

      {item.children?.length ? (
        <ul className="mt-4 space-y-2 border-l border-line pl-4">
          {item.children.map((child) => {
            const childDone = topicLearned(child);
            const childPriority =
              PLAN_PRIORITY_META[child.priority] || PLAN_PRIORITY_META.medium;
            return (
              <li key={child._id} className="flex items-start gap-3">
                <TickBox
                  checked={childDone}
                  disabled={disabled}
                  onClick={() => onToggle(child, !childDone)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p
                      className={`text-sm break-words ${
                        childDone ? "text-muted line-through" : ""
                      }`}
                    >
                      {child.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${childPriority.className}`}
                    >
                      {childPriority.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatPlanDate(child.date)}
                  </p>
                  <div className="mt-2">
                    <PlanRowActions
                      disabled={disabled}
                      onEdit={() => onEdit(child)}
                      onDelete={() => onDelete(child)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function TickBox({ checked, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={checked}
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        checked
          ? "border-teal/60 bg-teal text-[#10201e]"
          : "border-white/20 bg-transparent hover:border-teal/50"
      }`}
    >
      {checked ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3.5 8.2 6.4 11l6.1-7" />
        </svg>
      ) : null}
    </button>
  );
}
