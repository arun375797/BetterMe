import { useEffect, useMemo, useRef, useState } from "react";
import {
  createTodo,
  createTodos,
  createTodoTemplate,
  deleteTodoTemplate,
  getTodoTemplates,
} from "../api.js";
import TodoScheduleFields, { todayScheduleDate } from "./TodoScheduleFields.jsx";
import { buildScheduleRange, duePartsFromIso } from "./TimePicker12.jsx";

function dateValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clockValue(iso) {
  if (!iso) return "";
  return duePartsFromIso(iso).time;
}

function templateItemsForDate(todos, date) {
  return todos
    .filter((todo) => duePartsFromIso(todo.dueDate).date === date)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map((todo) => ({
      text: todo.text,
      priority: todo.priority || "medium",
      categoryId: todo.categoryId || null,
      startTime: clockValue(todo.dueDate),
      endTime: clockValue(todo.endDate),
    }));
}

export default function TodoComposer({
  categories = [],
  defaultCategoryId = "",
  todos = [],
  onCreated,
  onClose,
  accent = "#6ec8ff",
}) {
  const [mode, setMode] = useState("quick");
  const [text, setText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [templateDate, setTemplateDate] = useState(() => todayScheduleDate());
  const [applyDate, setApplyDate] = useState(() => todayScheduleDate());
  const inputRef = useRef(null);

  const bulkLines = useMemo(
    () => bulkText.split("\n").map((line) => line.trim()).filter(Boolean),
    [bulkText]
  );
  const sourceItems = useMemo(
    () => templateItemsForDate(todos, templateDate),
    [todos, templateDate]
  );

  useEffect(() => {
    if (mode === "quick") inputRef.current?.focus();
    if (mode === "templates") loadTemplates();
  }, [mode]);

  async function loadTemplates() {
    try {
      const data = await getTodoTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message);
    }
  }

  function sharedFields() {
    const schedule = buildScheduleRange(dueDate, dueTime, endTime);
    return { priority, categoryId: categoryId || null, ...schedule };
  }

  async function addQuick(event) {
    event?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError("");
    try {
      const todo = await createTodo({ text: trimmed, ...sharedFields() });
      onCreated?.([todo]);
      setText("");
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addBulk() {
    if (!bulkLines.length || saving) return;
    setSaving(true);
    setError("");
    try {
      const data = await createTodos(
        bulkLines.map((line) => ({ text: line, ...sharedFields() }))
      );
      onCreated?.(data.todos || []);
      setBulkText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveTemplate() {
    if (!templateName.trim()) {
      setError("Give this template a name.");
      return;
    }
    if (!sourceItems.length) {
      setError("There are no scheduled tasks on that date to save.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const template = await createTodoTemplate({ name: templateName.trim(), items: sourceItems });
      setTemplates((current) => [template, ...current]);
      setTemplateName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function applyTemplate(template) {
    if (!applyDate || saving) return;
    setSaving(true);
    setError("");
    try {
      const items = template.items.map((item) => ({
        text: item.text,
        priority: item.priority,
        categoryId: item.categoryId || null,
        ...buildScheduleRange(applyDate, item.startTime, item.endTime),
      }));
      const data = await createTodos(items);
      onCreated?.(data.todos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeTemplate(id) {
    if (!confirm("Delete this daily template?")) return;
    await deleteTodoTemplate(id);
    setTemplates((current) => current.filter((template) => template._id !== id));
  }

  function chooseDay(date) {
    setDueDate(date);
    setShowSchedule(false);
  }

  const fieldPanel = (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium text-muted">Priority</span>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg bg-white/5 px-2.5 py-2 text-xs text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40">
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </label>
      <label className="block min-w-0">
        <span className="mb-1.5 block text-[11px] font-medium text-muted">Category</span>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg bg-white/5 px-2.5 py-2 text-xs text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40">
          <option value="">No category</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.emoji ? `${category.emoji} ` : ""}{category.name}</option>)}
        </select>
      </label>
    </div>
  );

  return (
    <section className="rounded-2xl border bg-dialog p-4 shadow-lg" style={{ borderColor: `${accent}50` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-white/4 p-1">
          {[["quick", "Quick add"], ["bulk", "Bulk add"], ["templates", "Templates"]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => { setMode(key); setError(""); }} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${mode === key ? "bg-white/10 text-ink" : "text-muted hover:text-ink"}`}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5 hover:text-ink">Close</button>
      </div>

      {mode === "quick" ? (
        <form onSubmit={addQuick} className="mt-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 ring-1 ring-line focus-within:ring-cyan/40">
            <span className="text-lg text-cyan">+</span>
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task..." className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-muted" onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }} />
            <span className="hidden text-[11px] text-muted sm:block">Press Enter</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => chooseDay(dateValue(0))} className={`rounded-lg px-3 py-1.5 text-[11px] ring-1 ${dueDate === dateValue(0) ? "bg-cyan/15 text-cyan ring-cyan/35" : "text-muted ring-line"}`}>Today</button>
            <button type="button" onClick={() => chooseDay(dateValue(1))} className={`rounded-lg px-3 py-1.5 text-[11px] ring-1 ${dueDate === dateValue(1) ? "bg-cyan/15 text-cyan ring-cyan/35" : "text-muted ring-line"}`}>Tomorrow</button>
            <button type="button" onClick={() => { setShowSchedule((value) => !value); if (!dueDate) setDueDate(dateValue(0)); }} className="rounded-lg px-3 py-1.5 text-[11px] text-muted ring-1 ring-line hover:text-ink">Schedule</button>
            <button type="button" onClick={() => setShowMore((value) => !value)} className="rounded-lg px-3 py-1.5 text-[11px] text-muted ring-1 ring-line hover:text-ink">More options</button>
            {dueDate ? <button type="button" onClick={() => { setDueDate(""); setDueTime(""); setEndTime(""); }} className="px-2 text-[11px] text-muted hover:text-coral">Clear date</button> : null}
          </div>
          {showMore ? fieldPanel : null}
          {(showSchedule || showMore) ? <div className="mt-3 rounded-xl border border-line/70 bg-white/[0.025] p-3"><TodoScheduleFields date={dueDate} startTime={dueTime} endTime={endTime} onDateChange={setDueDate} onStartTimeChange={setDueTime} onEndTimeChange={setEndTime} compact /></div> : null}
        </form>
      ) : null}

      {mode === "bulk" ? (
        <div className="mt-4">
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={8} placeholder={"One task per line…\nJavaScript Practical — Block 1\nBreak: move and change posture\nLunch"} className="w-full resize-y rounded-xl bg-white/5 px-3 py-3 text-sm leading-6 text-ink outline-none ring-1 ring-line placeholder:text-muted focus:ring-cyan/40" />
          <p className="mt-2 text-[11px] text-muted">One line becomes one task. The options below apply to every task.</p>
          {fieldPanel}
          <div className="mt-3 flex justify-end">
            <button type="button" disabled={!bulkLines.length || saving} onClick={addBulk} className="rounded-lg px-4 py-2 text-xs font-medium text-overlay disabled:opacity-40" style={{ background: accent }}>{saving ? "Adding…" : `Add ${bulkLines.length || ""} Task${bulkLines.length === 1 ? "" : "s"}`}</button>
          </div>
        </div>
      ) : null}

      {mode === "templates" ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-line bg-white/[0.025] p-3">
            <p className="text-xs font-medium text-ink">Save a scheduled day as a template</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name, e.g. Study Day" className="rounded-lg bg-white/5 px-3 py-2 text-xs text-ink outline-none ring-1 ring-line" />
              <input type="date" value={templateDate} onChange={(e) => setTemplateDate(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-muted outline-none ring-1 ring-line" />
              <button type="button" onClick={saveTemplate} disabled={saving || !sourceItems.length} className="rounded-lg bg-cyan/15 px-3 py-2 text-xs font-medium text-cyan ring-1 ring-cyan/30 disabled:opacity-40">Save {sourceItems.length} tasks</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Create templates for</span>
            <input type="date" value={applyDate} onChange={(e) => setApplyDate(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-muted outline-none ring-1 ring-line" />
          </div>
          {templates.length ? templates.map((template) => (
            <div key={template._id} className="flex items-center gap-3 rounded-xl border border-line/70 bg-raised/50 p-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{template.name}</p><p className="text-[11px] text-muted">{template.items.length} tasks</p></div>
              <button type="button" onClick={() => applyTemplate(template)} disabled={saving} className="rounded-lg bg-cyan/15 px-3 py-1.5 text-xs font-medium text-cyan ring-1 ring-cyan/30 disabled:opacity-40">Use template</button>
              <button type="button" onClick={() => removeTemplate(template._id)} className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-coral/10 hover:text-coral">Delete</button>
            </div>
          )) : <p className="py-4 text-center text-xs text-muted">No templates yet. Save one from a day you have already scheduled.</p>}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-xs text-coral">{error}</p> : null}
    </section>
  );
}
