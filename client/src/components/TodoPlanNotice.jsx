import { useState } from "react";

const DEFAULT_PLAN = [
  { time: "5:15 AM", task: "Wake up, morning routine" },
  { time: "5:45–8:30 AM", task: "Indoor badminton + return home", icon: "🏸" },
  { time: "8:30–9:15 AM", task: "Bath → breakfast → insulin as prescribed → relax" },
  { time: "9:15–10:15 AM", task: "JavaScript Practical — Block 1", icon: "🔴", focus: true },
  { time: "10:15–10:30 AM", task: "Break / move / change posture" },
  { time: "10:30–11:30 AM", task: "JavaScript Practical — Block 2", icon: "🔴", focus: true },
  { time: "11:30 AM–12:00 PM", task: "Break / food / glucose care as needed" },
  { time: "12:00–1:30 PM", task: "Sleep — 1½ hours", icon: "😴", focus: true },
  { time: "1:30–2:00 PM", task: "Wake, lunch / refresh" },
  { time: "2:00–3:00 PM", task: "MongoDB Practical — queries", icon: "🟠", focus: true },
  { time: "3:00–3:15 PM", task: "Break" },
  { time: "3:15–4:00 PM", task: "Node.js Theory", icon: "🟡", focus: true },
  { time: "4:00–4:15 PM", task: "Break" },
  { time: "4:15–5:00 PM", task: "JavaScript Practical — Block 3", icon: "🔴", focus: true },
  { time: "5:00–5:15 PM", task: "Break" },
  { time: "5:15–5:45 PM", task: "MongoDB query revision", icon: "🟠", focus: true },
  { time: "5:45–6:15 PM", task: "Daily Mock QA", icon: "🎯", focus: true },
  { time: "6:15–6:30 PM", task: "Snack / prepare for badminton" },
  { time: "6:30/7:00–8:45 PM", task: "Outdoor badminton", icon: "🏸", focus: true },
  { time: "8:45–9:30 PM", task: "Bath → dinner → insulin/medication as prescribed" },
  { time: "9:30–10:15 PM", task: "Free time / anime / talk / relax" },
  { time: "10:15–10:45 PM", task: "Very light revision if comfortable — no coding" },
  { time: "10:45–11:00 PM", task: "Screens down, prepare for sleep" },
  { time: "11:00 PM–5:30 AM", task: "Night sleep — 6½ hours", icon: "💤", focus: true },
];

const STORAGE_KEY = "betterme.todo-plan-expanded";
const PLAN_STORAGE_KEY = "betterme.todo-plan-items";

function initialExpanded() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function loadPlan() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PLAN_STORAGE_KEY));
    if (Array.isArray(saved) && saved.length && saved.every((item) => item?.time && item?.task)) {
      return saved;
    }
  } catch {
    // Use the predefined timetable when saved data is unavailable or invalid.
  }
  return DEFAULT_PLAN;
}

export default function TodoPlanNotice() {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [plan, setPlan] = useState(loadPlan);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);

  function toggle() {
    setExpanded((current) => {
      const next = !current;
      if (!next) setEditing(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // The notice still works when browser storage is unavailable.
      }
      return next;
    });
  }

  function startEditing() {
    setDraft(plan.map((item) => ({ ...item })));
    setEditing(true);
  }

  function updateDraft(index, field, value) {
    setDraft((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  }

  function addBlock() {
    setDraft((current) => [...current, { time: "", task: "", icon: "", focus: false }]);
  }

  function removeBlock(index) {
    setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function saveChanges() {
    const cleaned = draft
      .map((item) => ({
        time: String(item.time || "").trim(),
        task: String(item.task || "").trim(),
        icon: String(item.icon || "").trim(),
        focus: Boolean(item.focus),
      }))
      .filter((item) => item.time && item.task);
    if (!cleaned.length) return;
    setPlan(cleaned);
    setEditing(false);
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // Keep the edits for this visit when browser storage is unavailable.
    }
  }

  function restoreDefault() {
    setDraft(DEFAULT_PLAN.map((item) => ({ ...item })));
  }

  return (
    <aside className="mt-5 overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] via-raised/80 to-cyan/[0.05] shadow-lg shadow-black/10">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls="long-term-todo-plan"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.035] sm:px-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-lg ring-1 ring-gold/25" aria-hidden="true">
          📌
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Long-term Daily Timetable</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {expanded ? "Keep this plan open while adding today’s tasks." : "Open this notice when you need a guide for creating todos."}
          </span>
        </span>
        <span className="hidden rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted uppercase ring-1 ring-line sm:block">
          Daily guide
        </span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-gold transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3.5 6l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded ? (
        <div id="long-term-todo-plan" className="border-t border-gold/15 px-3 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs leading-5 text-muted">
              {editing ? "Edit the timetable below, then save your changes." : "Your long-term reference plan. Use it as a guide and adjust individual days when needed."}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gold">{plan.length} time blocks</span>
              {!editing ? (
                <button type="button" onClick={startEditing} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-line hover:bg-white/10">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Edit plan
                </button>
              ) : null}
            </div>
          </div>
          {editing ? (
            <div className="rounded-xl border border-line/70 bg-surface/55 p-2 sm:p-3">
              <div
                data-lenis-prevent
                className="max-h-[32rem] touch-pan-y space-y-2 overflow-y-scroll overscroll-contain pr-1"
              >
                {draft.map((item, index) => (
                  <div key={index} className="grid grid-cols-[5.75rem_minmax(0,1fr)_2rem] gap-2 rounded-lg border border-line/60 bg-white/[0.025] p-2 sm:grid-cols-[9rem_3rem_minmax(0,1fr)_2rem]">
                    <input value={item.time} onChange={(event) => updateDraft(index, "time", event.target.value)} aria-label={`Time for block ${index + 1}`} placeholder="Time" className="min-w-0 rounded-lg bg-white/5 px-2.5 py-2 text-xs tabular-nums text-cyan outline-none ring-1 ring-line focus:ring-cyan/40" />
                    <input value={item.icon || ""} onChange={(event) => updateDraft(index, "icon", event.target.value)} aria-label={`Icon for block ${index + 1}`} placeholder="Icon" className="hidden min-w-0 rounded-lg bg-white/5 px-2 py-2 text-center text-xs text-ink outline-none ring-1 ring-line focus:ring-cyan/40 sm:block" />
                    <input value={item.task} onChange={(event) => updateDraft(index, "task", event.target.value)} aria-label={`Task for block ${index + 1}`} placeholder="Activity" className="min-w-0 rounded-lg bg-white/5 px-2.5 py-2 text-xs text-ink outline-none ring-1 ring-line focus:ring-cyan/40" />
                    <button type="button" onClick={() => removeBlock(index)} aria-label={`Remove block ${index + 1}`} title="Remove block" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-coral/10 hover:text-coral">×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addBlock} className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium text-cyan ring-1 ring-cyan/25 hover:bg-cyan/10">+ Add time block</button>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                <button type="button" onClick={restoreDefault} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-white/5 hover:text-ink">Restore predefined plan</button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-white/5 hover:text-ink">Cancel</button>
                  <button type="button" onClick={saveChanges} className="rounded-lg bg-cyan/20 px-4 py-1.5 text-xs font-medium text-cyan ring-1 ring-cyan/30 hover:bg-cyan/30">Save changes</button>
                </div>
              </div>
            </div>
          ) : (
            <div
              data-lenis-prevent
              tabIndex={0}
              aria-label="Daily timetable. Scroll to see all time blocks."
              className="max-h-[32rem] touch-pan-y overflow-y-scroll overscroll-contain rounded-xl border border-line/70 bg-surface/55 focus:outline-none focus:ring-1 focus:ring-cyan/35"
            >
              {plan.map((item, index) => (
                <div
                  key={`${item.time}-${item.task}-${index}`}
                  className={`grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-3 py-2.5 text-xs sm:grid-cols-[10rem_minmax(0,1fr)] sm:px-4 ${index ? "border-t border-line/45" : ""}`}
                >
                  <time className="font-medium tabular-nums text-cyan/90">{item.time}</time>
                  <span className={item.focus ? "font-medium text-ink" : "text-ink/80"}>
                    {item.icon ? <span className="mr-1.5" aria-hidden="true">{item.icon}</span> : null}
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 px-1 text-[11px] leading-5 text-muted">
            Health reminder: follow your prescribed insulin and medication plan; adjust exercise, food, and glucose care based on your clinician’s guidance and how you feel.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
