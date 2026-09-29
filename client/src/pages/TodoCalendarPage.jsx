import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import TodoScheduleFields from "../components/TodoScheduleFields.jsx";
import { buildScheduleRange } from "../components/TimePicker12.jsx";
import { createTodo, deleteTodo, getTodos, updateTodo } from "../api.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRIORITY_COLOR = {
  high: "#e88b7a",
  medium: "#e8c36a",
  low: "#3ce6d4",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function todoDateKey(value) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateKey(date);
}

function monthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const leading = (first.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const total = Math.ceil((leading + count) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index - leading + 1);
    return { date, key: dateKey(date), inMonth: date.getMonth() === month.getMonth() };
  });
}

function timeLabel(todo) {
  if (!todo.dueDate || /^\d{4}-\d{2}-\d{2}$/.test(String(todo.dueDate))) return "Any time";
  const date = new Date(todo.dueDate);
  // Date-only todos are stored by MongoDB as midnight UTC.
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && !todo.endDate) return "Any time";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function DayTodo({ todo, category, onToggle, onDelete }) {
  return (
    <div className={`group flex items-start gap-3 rounded-xl border border-line/60 bg-white/[0.025] p-3 ${todo.done ? "opacity-55" : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(todo)}
        aria-label={todo.done ? "Mark pending" : "Mark complete"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${todo.done ? "border-teal/60 bg-teal/15 text-teal" : "border-line hover:border-cyan/60"}`}
      >
        {todo.done ? "✓" : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-5 ${todo.done ? "line-through text-muted" : "text-ink"}`}>{todo.text}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="font-medium text-cyan">{timeLabel(todo)}</span>
          {category ? <span style={{ color: category.color }}>{category.emoji} {category.name}</span> : null}
          <span className="capitalize" style={{ color: PRIORITY_COLOR[todo.priority] || PRIORITY_COLOR.medium }}>{todo.priority || "medium"}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(todo)}
        aria-label={`Delete ${todo.text}`}
        title="Delete todo"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted opacity-100 hover:bg-coral/10 hover:text-coral sm:opacity-0 sm:group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

export default function TodoCalendarPage() {
  const { todoCategories = [] } = useOutletContext() || {};
  const today = dateKey(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formDate, setFormDate] = useState(today);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getTodos()
      .then((data) => {
        if (active) setTodos(data.todos || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!showAddForm) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) {
      if (event.key === "Escape" && !saving) setShowAddForm(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showAddForm, saving]);

  const categories = useMemo(
    () => Object.fromEntries(todoCategories.map((category) => [category._id, category])),
    [todoCategories]
  );
  const days = useMemo(() => monthDays(month), [month]);
  const byDay = useMemo(() => {
    const result = {};
    for (const todo of todos) {
      const key = todoDateKey(todo.dueDate);
      if (!key) continue;
      if (!result[key]) result[key] = [];
      result[key].push(todo);
    }
    for (const items of Object.values(result)) {
      items.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
    return result;
  }, [todos]);
  const selectedTodos = byDay[selected] || [];
  const unscheduled = todos.filter((todo) => !todo.dueDate);
  const selectedDate = localDate(selected);
  const selectedLabel = selectedDate.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function changeMonth(offset) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelected(dateKey(next));
  }

  function goToday() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(dateKey(now));
  }

  function selectDay(day) {
    setSelected(day.key);
    if (!day.inMonth) setMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
  }

  function openAddForm(key) {
    const date = localDate(key);
    setSelected(key);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setFormDate(key);
    setTitle("");
    setStartTime("");
    setEndTime("");
    setPriority("medium");
    setCategoryId("");
    setError("");
    setShowAddForm(true);
  }

  function closeAddForm() {
    if (!saving) setShowAddForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    const text = title.trim();
    if (!text) return;
    setSaving(true);
    setError("");
    try {
      const created = await createTodo({
        text,
        priority,
        categoryId: categoryId || null,
        ...buildScheduleRange(formDate, startTime, endTime),
      });
      setTodos((current) => [created, ...current]);
      if (formDate) {
        const createdDate = localDate(formDate);
        setSelected(formDate);
        setMonth(new Date(createdDate.getFullYear(), createdDate.getMonth(), 1));
      }
      setTitle("");
      setStartTime("");
      setEndTime("");
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTodo(todo) {
    const done = !todo.done;
    setTodos((current) => current.map((item) => item._id === todo._id ? { ...item, done } : item));
    try {
      const updated = await updateTodo(todo._id, { done });
      setTodos((current) => current.map((item) => item._id === todo._id ? { ...item, ...updated } : item));
    } catch (err) {
      setTodos((current) => current.map((item) => item._id === todo._id ? todo : item));
      setError(err.message);
    }
  }

  async function removeTodo(todo) {
    if (!confirm(`Delete “${todo.text}”?`)) return;
    setTodos((current) => current.filter((item) => item._id !== todo._id));
    try {
      await deleteTodo(todo._id);
    } catch (err) {
      setTodos((current) => [todo, ...current]);
      setError(err.message);
    }
  }

  return (
    <div className="page-pad">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-cyan uppercase">My Todos</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted">Plan your days and see every scheduled todo in one place.</p>
        </div>
        <Link to="/todos" className="rounded-xl border border-line bg-white/5 px-4 py-2 text-sm text-muted hover:bg-white/10 hover:text-ink">All Todos</Link>
      </header>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p> : null}

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-line bg-raised/75 shadow-xl shadow-black/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/5 text-lg text-muted hover:text-ink">‹</button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/5 text-lg text-muted hover:text-ink">›</button>
              <button type="button" onClick={goToday} className="ml-1 rounded-lg px-3 py-2 text-xs font-medium text-cyan ring-1 ring-cyan/30 hover:bg-cyan/10">Today</button>
            </div>
            <h2 className="text-lg font-semibold text-ink">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</h2>
          </div>

          <div className="grid grid-cols-7 border-b border-line bg-white/[0.025]">
            {WEEKDAYS.map((day) => <div key={day} className="px-1 py-2.5 text-center text-[10px] font-semibold tracking-wider text-muted uppercase sm:text-xs">{day}</div>)}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const items = byDay[day.key] || [];
              const isSelected = day.key === selected;
              const isToday = day.key === today;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={day.key}
                  onClick={() => selectDay(day)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectDay(day);
                    }
                  }}
                  className={`relative min-h-[4.6rem] border-b border-r border-line/60 p-1.5 text-left transition-colors sm:min-h-[7.25rem] sm:p-2 ${index % 7 === 6 ? "border-r-0" : ""} ${day.inMonth ? "bg-surface/30" : "bg-black/10 text-muted/45"} ${isSelected ? "z-10 bg-cyan/[0.07] ring-1 ring-inset ring-cyan/55" : "hover:bg-white/[0.035]"}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium sm:h-7 sm:w-7 sm:text-xs ${isToday ? "bg-cyan text-[#07131c]" : day.inMonth ? "text-ink" : "text-muted/50"}`}>{day.date.getDate()}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openAddForm(day.key);
                      }}
                      aria-label={`Add todo on ${day.date.toLocaleDateString()}`}
                      title="Add todo on this date"
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/[0.07] text-sm font-medium text-cyan opacity-75 transition-all hover:border-cyan/45 hover:bg-cyan/20 hover:opacity-100 sm:h-7 sm:w-7"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {items.slice(0, 3).map((todo) => {
                      const category = categories[todo.categoryId];
                      const color = category?.color || PRIORITY_COLOR[todo.priority] || PRIORITY_COLOR.medium;
                      return (
                        <div key={todo._id} className={`flex items-center gap-1 overflow-hidden rounded px-1 py-0.5 sm:bg-white/[0.035] ${todo.done ? "opacity-45" : ""}`}>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                          <span className={`hidden truncate text-[10px] sm:block ${todo.done ? "line-through text-muted" : "text-ink/85"}`}>{todo.text}</span>
                        </div>
                      );
                    })}
                    {items.length > 3 ? <span className="block text-[9px] text-muted sm:pl-1">+{items.length - 3} more</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
          {loading ? <p className="border-t border-line px-5 py-3 text-xs text-muted">Loading calendar…</p> : null}
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <section className="rounded-2xl border border-line bg-raised/80 p-4 shadow-lg shadow-black/10 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.16em] text-cyan uppercase">Selected day</p>
                <h2 className="mt-1 text-base font-semibold text-ink">{selectedLabel}</h2>
              </div>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted ring-1 ring-line">{selectedTodos.length} tasks</span>
            </div>

            <button type="button" onClick={() => openAddForm(selected)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan/15 px-4 py-2.5 text-sm font-medium text-cyan ring-1 ring-cyan/30 hover:bg-cyan/25"><span className="text-lg leading-none">+</span>Add todo for this day</button>

            <div className="mt-4 space-y-2">
              {selectedTodos.length ? selectedTodos.map((todo) => <DayTodo key={todo._id} todo={todo} category={categories[todo.categoryId]} onToggle={toggleTodo} onDelete={removeTodo} />) : <div className="rounded-xl border border-dashed border-line p-5 text-center"><p className="text-sm text-ink">No tasks planned</p><p className="mt-1 text-xs text-muted">Add the first todo for this day above.</p></div>}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-raised/65 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] tracking-[0.16em] text-gold uppercase">Needs scheduling</p><h2 className="mt-1 text-sm font-semibold text-ink">Unscheduled todos</h2></div><span className="text-xs text-muted">{unscheduled.length}</span></div>
            {unscheduled.length ? <div className="mt-3 space-y-2">{unscheduled.slice(0, 5).map((todo) => <div key={todo._id} className="flex items-center gap-2 text-xs"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_COLOR[todo.priority] || PRIORITY_COLOR.medium }} /><span className={`min-w-0 flex-1 truncate ${todo.done ? "line-through text-muted" : "text-ink/80"}`}>{todo.text}</span></div>)}{unscheduled.length > 5 ? <p className="text-[11px] text-muted">+{unscheduled.length - 5} more in All Todos</p> : null}</div> : <p className="mt-3 text-xs text-muted">Everything has a date. Nicely planned.</p>}
            <Link to="/todos" className="mt-4 inline-flex text-xs font-medium text-cyan hover:underline">Manage all todos →</Link>
          </section>
        </aside>
      </div>

      {showAddForm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <button type="button" onClick={closeAddForm} aria-label="Close add todo form" className="fixed inset-0 bg-overlay/75 backdrop-blur-sm" />
          <section role="dialog" aria-modal="true" aria-labelledby="calendar-add-title" className="relative my-auto w-full max-w-xl rounded-2xl border border-line bg-dialog p-5 shadow-2xl ring-1 ring-white/5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.16em] text-cyan uppercase">Calendar todo</p>
                <h2 id="calendar-add-title" className="mt-1 text-lg font-semibold text-ink">Add a new todo</h2>
                <p className="mt-1 text-xs text-muted">{formDate ? `Create a detailed task for ${localDate(formDate).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}.` : "Create a task without a fixed date."}</p>
              </div>
              <button type="button" onClick={closeAddForm} disabled={saving} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl text-muted hover:bg-white/5 hover:text-ink">×</button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">What needs to be done?</span>
                <textarea autoFocus rows={3} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter your todo…" className="w-full resize-none rounded-xl bg-white/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-muted/60 focus:ring-cyan/45" />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted">Priority</span>
                <div className="grid grid-cols-3 gap-2">
                  {["high", "medium", "low"].map((value) => (
                    <button key={value} type="button" onClick={() => setPriority(value)} className={`rounded-xl border py-2 text-xs font-medium capitalize transition-colors ${priority === value ? "border-transparent text-[#0d1120]" : "border-line bg-white/5 text-muted hover:text-ink"}`} style={priority === value ? { background: PRIORITY_COLOR[value] } : undefined}>{value}</button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Category</span>
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm text-muted ring-1 ring-line outline-none focus:ring-cyan/40"><option value="">No category</option>{todoCategories.map((category) => <option key={category._id} value={category._id}>{category.emoji ? `${category.emoji} ` : ""}{category.name}</option>)}</select>
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted">When will you do it?</span>
                <div className="rounded-xl border border-line/70 bg-white/[0.025] p-3">
                  <TodoScheduleFields date={formDate} startTime={startTime} endTime={endTime} onDateChange={setFormDate} onStartTimeChange={setStartTime} onEndTimeChange={setEndTime} compact />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line/70 pt-4">
                <button type="button" onClick={closeAddForm} disabled={saving} className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/5 hover:text-ink">Cancel</button>
                <button type="submit" disabled={!title.trim() || saving} className="rounded-xl bg-cyan/20 px-5 py-2 text-sm font-medium text-cyan ring-1 ring-cyan/30 hover:bg-cyan/30 disabled:cursor-not-allowed disabled:opacity-45">{saving ? "Adding…" : "Add Todo"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
