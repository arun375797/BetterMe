import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import CategoryFormModal from "../components/CategoryFormModal.jsx";
import TimePicker12, {
  buildDueIso,
  duePartsFromIso,
} from "../components/TimePicker12.jsx";
import {
  createTodo,
  deleteTodo,
  deleteTodoCategory,
  getTodoCategories,
  getTodos,
  updateTodo,
} from "../api.js";

// ── helpers ───────────────────────────────────────────────────

const PRIORITY_META = {
  high: { label: "High", color: "#e88b7a", dot: "bg-[#e88b7a]" },
  medium: { label: "Medium", color: "#e8c36a", dot: "bg-[#e8c36a]" },
  low: { label: "Low", color: "#3ce6d4", dot: "bg-[#3ce6d4]" },
};

function dateGroup(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const diffMs = startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 6) return "This Week";
  if (diffDays <= 30) return "This Month";
  return "Older";
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "This Month", "Older"];

function groupTodos(todos) {
  const map = {};
  for (const todo of todos) {
    const g = dateGroup(todo.createdAt);
    if (!map[g]) map[g] = [];
    map[g].push(todo);
  }
  return GROUP_ORDER.filter((g) => map[g]).map((g) => ({ group: g, items: map[g] }));
}

function fmtTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDueTime(dateStr) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getHours() === 0 && d.getMinutes() === 0) return null;
  return fmtTime(dateStr);
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── sub-components ────────────────────────────────────────────

function PriorityDot({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${m.dot}`}
      title={m.label}
    />
  );
}

function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        background: `${category.color}18`,
        color: category.color,
        border: `1px solid ${category.color}40`,
      }}
    >
      {category.emoji ? <span>{category.emoji}</span> : null}
      {category.name}
    </span>
  );
}

function EditTodoModal({ todo, categories, onSave, onClose }) {
  const [text, setText] = useState(todo.text);
  const [priority, setPriority] = useState(todo.priority || "medium");
  const [categoryId, setCategoryId] = useState(todo.categoryId || "");
  const dueInit = duePartsFromIso(todo.dueDate);
  const [dueDate, setDueDate] = useState(dueInit.date);
  const [dueTime, setDueTime] = useState(dueInit.time);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Text cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(todo._id, {
        text: trimmed,
        priority,
        categoryId: categoryId || null,
        dueDate: buildDueIso(dueDate, dueTime),
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[#0b0f18]/72 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-[#1e2638] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Edit Todo</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Text */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              What needs to be done
            </label>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl bg-white/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-line focus:ring-cyan/40"
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Priority
            </label>
            <div className="flex gap-2">
              {["high", "medium", "low"].map((p) => {
                const m = PRIORITY_META[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all ${
                      priority === p
                        ? "border-transparent text-[#0d1120]"
                        : "border-line bg-white/4 text-muted hover:text-ink"
                    }`}
                    style={priority === p ? { background: m.color } : {}}
                  >
                    {p === "high" ? "🔴" : p === "medium" ? "🟡" : "🟢"} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.emoji ? `${c.emoji} ` : ""}{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due date + time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Due date &amp; time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (!e.target.value) setDueTime("");
                }}
                className="flex-1 rounded-xl bg-white/5 px-3 py-2.5 text-sm text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40"
              />
              <TimePicker12
                value={dueTime}
                onChange={setDueTime}
                disabled={!dueDate}
              />
            </div>
            {dueDate ? (
              <button
                type="button"
                onClick={() => { setDueDate(""); setDueTime(""); }}
                className="mt-1.5 text-[11px] text-muted hover:text-coral"
              >
                Clear due date
              </button>
            ) : null}
          </div>

          {error ? <p className="text-xs text-coral">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/5 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan/20 px-5 py-2 text-sm font-medium text-cyan ring-1 ring-cyan/30 hover:bg-cyan/30 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TodoRow({ todo, category, onToggle, onDelete, onOpenEdit }) {
  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
        todo.done
          ? "border-line/40 bg-white/2 opacity-60"
          : "border-line/60 bg-[#222838]/60 hover:border-line"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(todo._id, !todo.done)}
        aria-label={todo.done ? "Mark pending" : "Mark done"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          todo.done
            ? "border-cyan/60 bg-cyan/20 text-cyan"
            : "border-line hover:border-cyan/60"
        }`}
      >
        {todo.done ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <p
          onDoubleClick={() => onOpenEdit(todo)}
          title="Double-click to edit"
          className={`cursor-default text-sm leading-relaxed select-none ${
            todo.done ? "line-through text-muted" : "text-ink"
          }`}
        >
          {todo.text}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <PriorityDot priority={todo.priority} />
          {category ? <CategoryBadge category={category} /> : null}
          <span className="text-[11px] text-muted">
            {dateGroup(todo.createdAt) === "Today"
              ? fmtTime(todo.createdAt)
              : `${fmtDate(todo.createdAt)} · ${fmtTime(todo.createdAt)}`}
          </span>
          {todo.dueDate ? (
            <span className="text-[11px] text-gold">
              Due {fmtDate(todo.dueDate)}
              {fmtDueTime(todo.dueDate) ? ` · ${fmtDueTime(todo.dueDate)}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onOpenEdit(todo)}
          title="Edit"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path
              d="M11 2l3 3-8 8H3v-3l8-8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo._id)}
          title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-coral/15 hover:text-coral"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path
              d="M3 4h10M6 4V3h4v1M5 4l.5 8h5l.5-8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AddTodoForm({ categories, defaultCategoryId, onAdd, onCancel }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please write what you need to do.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onAdd({
        text: trimmed,
        priority,
        categoryId: categoryId || null,
        dueDate: buildDueIso(dueDate, dueTime),
      });
      setText("");
      setDueDate("");
      setDueTime("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-cyan/30 bg-[#1e2638] p-4 shadow-lg ring-1 ring-cyan/10"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan" />
        <span className="text-xs font-medium tracking-wide text-cyan uppercase">
          New Todo
        </span>
      </div>

      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What do you need to do?"
        rows={2}
        className="w-full resize-none rounded-xl bg-white/5 px-3 py-2.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-line focus:ring-cyan/40"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit(e);
          }
          if (e.key === "Escape") onCancel();
        }}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40"
        >
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.emoji ? `${c.emoji} ` : ""}{c.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40"
        />
        <TimePicker12
          value={dueTime}
          onChange={setDueTime}
          disabled={!dueDate}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-white/5 hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-cyan/20 px-4 py-1.5 text-xs font-medium text-cyan ring-1 ring-cyan/30 hover:bg-cyan/30 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add Todo"}
        </button>
      </div>
    </form>
  );
}

function StatCard({ label, value, sub, color = "#6ec8ff" }) {
  return (
    <div className="rounded-2xl border border-line bg-[#222838]/80 p-4">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold" style={{ color }}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────

export default function TodoHome() {
  const ctx = useOutletContext() || {};
  const { todoCategories: ctxCategories = [], refreshTodoCategories } = ctx;
  const [searchParams, setSearchParams] = useSearchParams();

  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState(ctxCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(
    searchParams.get("new") === "category"
  );
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    if (searchParams.get("new") === "category") {
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    const editId = searchParams.get("editCategory");
    if (!editId || categories.length === 0) return;
    const cat = categories.find((c) => c._id === editId);
    if (cat) setEditingCategory(cat);
    const next = new URLSearchParams(searchParams);
    next.delete("editCategory");
    setSearchParams(next, { replace: true });
  }, [categories, searchParams]);

  const [filterStatus, setFilterStatus] = useState("all"); // all | pending | done
  const [filterCategory, setFilterCategory] = useState("all"); // all | cat-id

  async function loadAll() {
    setLoading(true);
    try {
      const [todosRes, catsRes] = await Promise.all([
        getTodos(),
        getTodoCategories(),
      ]);
      setTodos(todosRes.todos || []);
      setCategories(catsRes.categories || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const catMap = Object.fromEntries(categories.map((c) => [c._id, c]));

  const filtered = todos.filter((t) => {
    if (filterStatus === "pending" && t.done) return false;
    if (filterStatus === "done" && !t.done) return false;
    if (filterCategory !== "all") {
      if (filterCategory === "none" && t.categoryId != null) return false;
      if (filterCategory !== "none" && t.categoryId !== filterCategory) return false;
    }
    return true;
  });

  const grouped = groupTodos(filtered);

  const total = todos.length;
  const pending = todos.filter((t) => !t.done).length;
  const doneToday = todos.filter((t) => {
    if (!t.done || !t.completedAt) return false;
    return dateGroup(t.completedAt) === "Today";
  }).length;

  async function handleToggle(id, done) {
    const prev = todos;
    setTodos((ts) => ts.map((t) => (t._id === id ? { ...t, done } : t)));
    try {
      await updateTodo(id, { done });
    } catch {
      setTodos(prev);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this todo?")) return;
    setTodos((ts) => ts.filter((t) => t._id !== id));
    try {
      await deleteTodo(id);
    } catch {
      await loadAll();
    }
  }

  async function handleEdit(id, data) {
    const updated = await updateTodo(id, data);
    setTodos((ts) => ts.map((t) => (t._id === id ? { ...t, ...updated } : t)));
  }

  async function handleAdd(data) {
    const todo = await createTodo(data);
    setTodos((ts) => [todo, ...ts]);
    setShowAddForm(false);
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Delete this category? Todos will become uncategorized.")) return;
    try {
      await deleteTodoCategory(id);
      setCategories((cs) => cs.filter((c) => c._id !== id));
      setTodos((ts) =>
        ts.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t))
      );
      if (filterCategory === id) setFilterCategory("all");
      setEditingCategory((c) => (c?._id === id ? null : c));
      refreshTodoCategories?.();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCategorySaved(cat) {
    setCategories((cs) => {
      const exists = cs.some((c) => c._id === cat._id);
      return exists ? cs.map((c) => (c._id === cat._id ? cat : c)) : [...cs, cat];
    });
    setShowNewCategory(false);
    setEditingCategory(null);
    refreshTodoCategories?.();
  }

  return (
    <div className="page-pad">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-cyan uppercase">
            My Todos
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            All Tasks
          </h1>
          <p className="mt-1 text-sm text-muted">
            Every todo across all categories, ordered by time.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white/4 px-3 py-2 text-sm text-muted hover:bg-white/8 hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Category
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan/20 px-4 py-2 text-sm font-medium text-cyan ring-1 ring-cyan/30 hover:bg-cyan/30"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Add Todo
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </p>
      ) : null}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={total} sub="all todos" color="#6ec8ff" />
        <StatCard
          label="Pending"
          value={pending}
          sub={`${total - pending} done`}
          color="#e8c36a"
        />
        <StatCard
          label="Done Today"
          value={doneToday}
          sub="completed today"
          color="#3ce6d4"
        />
        <StatCard
          label="Categories"
          value={categories.length}
          sub="active buckets"
          color="#b9a6ff"
        />
      </div>

      {/* Add Todo form */}
      {showAddForm ? (
        <div className="mt-5">
          <AddTodoForm
            categories={categories}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : null}

      {/* Category chips */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterCategory("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-cyan/20 text-cyan ring-1 ring-cyan/30"
              : "text-muted hover:bg-white/5 hover:text-ink"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory("none")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filterCategory === "none"
              ? "bg-white/10 text-ink ring-1 ring-white/20"
              : "text-muted hover:bg-white/5 hover:text-ink"
          }`}
        >
          Uncategorized
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            type="button"
            onClick={() =>
              setFilterCategory((prev) =>
                prev === cat._id ? "all" : cat._id
              )
            }
            className="group/cat relative rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={
              filterCategory === cat._id
                ? {
                    background: `${cat.color}20`,
                    color: cat.color,
                    boxShadow: `0 0 0 1px ${cat.color}40`,
                  }
                : {}
            }
          >
            <span
              className={filterCategory === cat._id ? "" : "text-muted hover:text-ink"}
            >
              {cat.emoji ? `${cat.emoji} ` : ""}
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Status filter + Category management strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-white/4 p-1">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "done", label: "Done" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterStatus(key)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                filterStatus === key
                  ? "bg-white/10 text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/todos/category/${cat._id}`}
                className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] transition-colors hover:opacity-90"
                style={{
                  borderColor: `${cat.color}40`,
                  background: `${cat.color}10`,
                  color: cat.color,
                }}
              >
                {cat.emoji ? <span>{cat.emoji}</span> : null}
                {cat.name}
                <svg
                  viewBox="0 0 12 12"
                  className="h-2.5 w-2.5 opacity-60"
                  fill="none"
                >
                  <path
                    d="M5 2l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* Timeline */}
      <div className="mt-6 space-y-8">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white/4 text-2xl">
              ✓
            </div>
            <p className="text-sm font-medium text-ink">
              {filterStatus === "done"
                ? "No completed todos yet"
                : "Nothing here yet"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {filterStatus === "pending"
                ? "All caught up!"
                : 'Click "Add Todo" to get started.'}
            </p>
          </div>
        ) : (
          grouped.map(({ group, items }) => (
            <div key={group}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
                  {group}
                </span>
                <span className="flex-1 border-t border-line/50" />
                <span className="text-[11px] text-muted">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((todo) => (
                  <TodoRow
                    key={todo._id}
                    todo={todo}
                    category={todo.categoryId ? catMap[todo.categoryId] : null}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onOpenEdit={setEditingTodo}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Categories section */}
      {categories.length > 0 ? (
        <div className="mt-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              Categories
            </span>
            <span className="flex-1 border-t border-line/50" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const catTodos = todos.filter((t) => t.categoryId === cat._id);
              const catPending = catTodos.filter((t) => !t.done).length;
              return (
                <Link
                  key={cat._id}
                  to={`/todos/category/${cat._id}`}
                  className="group relative rounded-2xl border p-4 transition-all hover:shadow-lg"
                  style={{
                    borderColor: `${cat.color}30`,
                    background: `${cat.color}08`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl">{cat.emoji || "📁"}</span>
                      <h3
                        className="mt-2 text-base font-semibold"
                        style={{ color: cat.color }}
                      >
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {catTodos.length} total · {catPending} pending
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingCategory(cat);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                        title="Edit category"
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                          <path
                            d="M11 2l3 3-8 8H3v-3l8-8z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteCategory(cat._id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-coral/15 hover:text-coral"
                        title="Delete category"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3.5 w-3.5"
                          fill="none"
                        >
                          <path
                            d="M3 4h10M6 4V3h4v1M5 4l.5 8h5l.5-8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-white/5">
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        background: cat.color,
                        width:
                          catTodos.length > 0
                            ? `${Math.round(
                                ((catTodos.length - catPending) /
                                  catTodos.length) *
                                  100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {catTodos.length > 0
                      ? `${Math.round(
                          ((catTodos.length - catPending) / catTodos.length) *
                            100
                        )}% complete`
                      : "No todos yet"}
                  </p>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-8 text-muted transition-colors hover:border-cyan/40 hover:text-cyan"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs font-medium">New Category</span>
            </button>
          </div>
        </div>
      ) : null}

      {showNewCategory ? (
        <CategoryFormModal
          onClose={() => setShowNewCategory(false)}
          onSaved={handleCategorySaved}
        />
      ) : null}

      {editingCategory ? (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={handleCategorySaved}
          onDelete={() => handleDeleteCategory(editingCategory._id)}
        />
      ) : null}

      {editingTodo ? (
        <EditTodoModal
          todo={editingTodo}
          categories={categories}
          onSave={handleEdit}
          onClose={() => setEditingTodo(null)}
        />
      ) : null}
    </div>
  );
}
