import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
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

const PRIORITY_META = {
  high: { label: "High", dot: "bg-[#e88b7a]", color: "#e88b7a" },
  medium: { label: "Medium", dot: "bg-[#e8c36a]", color: "#e8c36a" },
  low: { label: "Low", dot: "bg-[#3ce6d4]", color: "#3ce6d4" },
};

function dateGroup(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const diffMs =
    startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
  return GROUP_ORDER.filter((g) => map[g]).map((g) => ({
    group: g,
    items: map[g],
  }));
}

function fmtTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
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
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function EditTodoModal({ todo, categories, catColor, onSave, onClose }) {
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
    if (!trimmed) { setError("Text cannot be empty."); return; }
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
      <button type="button" aria-label="Close" onClick={onClose}
        className="absolute inset-0 bg-[#0b0f18]/72 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-[#1e2638] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Edit Todo</h2>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">What needs to be done</label>
            <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl bg-white/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-line focus:ring-1"
              style={{ "--tw-ring-color": `${catColor}60` }}
              onKeyDown={(e) => { if (e.key === "Escape") onClose(); }} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Priority</label>
            <div className="flex gap-2">
              {["high", "medium", "low"].map((p) => {
                const colors = { high: "#e88b7a", medium: "#e8c36a", low: "#3ce6d4" };
                const labels = { high: "High", medium: "Medium", low: "Low" };
                const icons = { high: "🔴", medium: "🟡", low: "🟢" };
                return (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all ${
                      priority === p ? "border-transparent text-[#0d1120]" : "border-line bg-white/4 text-muted hover:text-ink"
                    }`}
                    style={priority === p ? { background: colors[p] } : {}}>
                    {icons[p]} {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-muted ring-1 ring-line focus:outline-none">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.emoji ? `${c.emoji} ` : ""}{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Due date &amp; time</label>
            <div className="flex gap-2">
              <input type="date" value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); if (!e.target.value) setDueTime(""); }}
                className="flex-1 rounded-xl bg-white/5 px-3 py-2.5 text-sm text-muted ring-1 ring-line focus:outline-none" />
              <TimePicker12
                value={dueTime}
                onChange={setDueTime}
                disabled={!dueDate}
              />
            </div>
            {dueDate ? (
              <button type="button" onClick={() => { setDueDate(""); setDueTime(""); }}
                className="mt-1.5 text-[11px] text-muted hover:text-coral">
                Clear due date
              </button>
            ) : null}
          </div>

          {error ? <p className="text-xs text-coral">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/5 hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-xl px-5 py-2 text-sm font-medium text-[#0d1120] disabled:opacity-50"
              style={{ background: catColor }}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TodoRow({ todo, catColor, onToggle, onDelete, onOpenEdit }) {
  const pm = PRIORITY_META[todo.priority] || PRIORITY_META.medium;

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
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
        style={
          todo.done
            ? { borderColor: `${catColor}80`, background: `${catColor}25`, color: catColor }
            : { borderColor: "#343c4d" }
        }
      >
        {todo.done ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <p
          onDoubleClick={() => onOpenEdit(todo)}
          title="Double-click to edit"
          className={`cursor-default select-none text-sm leading-relaxed ${
            todo.done ? "line-through text-muted" : "text-ink"
          }`}
        >
          {todo.text}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${pm.dot}`} title={pm.label} />
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
        <button type="button" onClick={() => onOpenEdit(todo)} title="Edit"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" onClick={() => onDelete(todo._id)} title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-coral/15 hover:text-coral">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path d="M3 4h10M6 4V3h4v1M5 4l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function InlineAddForm({ catColor, categories, categoryId, onAdd, onCancel }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
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
      await onAdd({ text: trimmed, priority, categoryId, dueDate: buildDueIso(dueDate, dueTime) });
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
      className="rounded-2xl border p-4"
      style={{ borderColor: `${catColor}40`, background: `${catColor}06` }}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What do you need to do in this category?"
        rows={2}
        className="w-full resize-none rounded-xl bg-white/5 px-3 py-2.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-line"
        style={{ "--tw-ring-color": `${catColor}40` }}
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
          className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-muted ring-1 ring-line focus:outline-none"
        >
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-muted ring-1 ring-line focus:outline-none"
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
          className="rounded-lg px-4 py-1.5 text-xs font-medium text-[#0b0f18] disabled:opacity-50"
          style={{ background: catColor }}
        >
          {saving ? "Adding…" : "Add Todo"}
        </button>
      </div>
    </form>
  );
}

export default function TodoCategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const ctx = useOutletContext() || {};
  const { refreshTodoCategories } = ctx;

  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingTodo, setEditingTodo] = useState(null);
  const [showEditCategory, setShowEditCategory] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [todosRes, catsRes] = await Promise.all([
        getTodos({ category: categoryId }),
        getTodoCategories(),
      ]);
      const cats = catsRes.categories || [];
      const cat = cats.find((c) => c._id === categoryId) || null;
      setCategory(cat);
      setCategories(cats);
      setTodos(todosRes.todos || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [categoryId]);

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
      await loadData();
    }
  }

  async function handleEdit(id, data) {
    const updated = await updateTodo(id, data);
    setTodos((ts) => ts.map((t) => (t._id === id ? { ...t, ...updated } : t)));
  }

  async function handleAdd(data) {
    const todo = await createTodo({ ...data, categoryId });
    setTodos((ts) => [todo, ...ts]);
    setShowAddForm(false);
  }

  async function handleDeleteCategory() {
    if (!category) return;
    if (!confirm("Delete this category? Todos will become uncategorized.")) return;
    try {
      await deleteTodoCategory(category._id);
      refreshTodoCategories?.();
      navigate("/todos");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCategorySaved(updated) {
    setCategory(updated);
    setCategories((cs) => cs.map((c) => (c._id === updated._id ? updated : c)));
    setShowEditCategory(false);
    refreshTodoCategories?.();
  }

  const catColor = category?.color || "#6ec8ff";

  const filtered = todos.filter((t) => {
    if (filterStatus === "pending") return !t.done;
    if (filterStatus === "done") return t.done;
    return true;
  });
  const grouped = groupTodos(filtered);

  const pending = todos.filter((t) => !t.done).length;
  const done = todos.filter((t) => t.done).length;
  const pct = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0;

  if (!loading && !category) {
    return (
      <div className="page-pad">
        <p className="text-sm text-muted">
          Category not found.{" "}
          <Link to="/todos" className="text-cyan hover:underline">
            Go back
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page-pad">
      {/* Breadcrumb */}
      <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
        <Link to="/todos" className="hover:text-cyan">
          My Todos
        </Link>
        {" · "}
        <span style={{ color: catColor }}>
          {category?.emoji || ""} {category?.name || "…"}
        </span>
      </p>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
            style={{ background: `${catColor}18`, border: `1px solid ${catColor}30` }}
          >
            {category?.emoji || "📁"}
          </div>
          <div>
            <h1
              className="text-2xl font-semibold sm:text-3xl"
              style={{ color: catColor }}
            >
              {category?.name || "…"}
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              {todos.length} todos · {pending} pending · {pct}% done
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEditCategory(true)}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-ink"
            style={{ borderColor: `${catColor}40` }}
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
            Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteCategory}
            className="flex items-center gap-1.5 rounded-xl border border-coral/30 px-3 py-2 text-sm text-coral hover:bg-coral/10"
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
            Delete
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-[#0b0f18]"
            style={{ background: catColor }}
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

      {/* Progress bar */}
      {todos.length > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ background: catColor, width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </p>
      ) : null}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: todos.length },
          { label: "Pending", value: pending },
          { label: "Done", value: done },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border p-3 text-center"
            style={{
              borderColor: `${catColor}25`,
              background: `${catColor}08`,
            }}
          >
            <p
              className="text-xl font-semibold"
              style={{ color: catColor }}
            >
              {value}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm ? (
        <div className="mt-5">
          <InlineAddForm
            catColor={catColor}
            categoryId={categoryId}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : null}

      {/* Filter */}
      <div className="mt-6 flex items-center gap-1 rounded-xl bg-white/4 p-1 w-fit">
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

      {/* Timeline */}
      <div className="mt-6 space-y-8">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
              style={{ border: `1px solid ${catColor}30`, background: `${catColor}10` }}
            >
              {category?.emoji || "📁"}
            </div>
            <p className="text-sm font-medium text-ink">
              {filterStatus === "done"
                ? "Nothing completed yet"
                : "No todos here yet"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {filterStatus === "pending"
                ? "All tasks are done — great work!"
                : 'Hit "Add Todo" to get started.'}
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
                    catColor={catColor}
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

      {showEditCategory && category ? (
        <CategoryFormModal
          category={category}
          onClose={() => setShowEditCategory(false)}
          onSaved={handleCategorySaved}
          onDelete={handleDeleteCategory}
        />
      ) : null}

      {editingTodo ? (
        <EditTodoModal
          todo={editingTodo}
          categories={categories}
          catColor={catColor}
          onSave={handleEdit}
          onClose={() => setEditingTodo(null)}
        />
      ) : null}
    </div>
  );
}
