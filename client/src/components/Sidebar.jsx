import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "./Logo.jsx";
import Sit25Mark from "./Sit25Mark.jsx";
import MusicControl from "./MusicControl.jsx";
import { MusicNowPlaying } from "./MusicProgress.jsx";
import { PERSONALITY_NAV } from "../personality.js";
import { deleteTodoCategory } from "../api.js";
import LogoutButton from "./LogoutButton.jsx";

const healthItems = [
  { label: "Sugar", path: "/health/sugar" },
  {
    label: "Exercise",
    path: "/health/exercise",
    children: [
      { label: "Yoga", path: "/health/exercise/yoga" },
      { label: "Badminton", path: "/health/exercise/badminton" },
      { label: "Weight training", path: "/health/exercise/weight" },
    ],
  },
  { label: "Vitamin", path: "/health/vitamin" },
  { label: "Food", path: "/health/food" },
  { label: "Sleep", path: "/health/sleep" },
];

const reportItems = [{ label: "Statistics", path: "/report/statistics" }];

function ChevronUp() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 12l5-5 5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar({
  subjects,
  books = [],
  todoCategories = [],
  refreshTodoCategories,
  open = false,
  onClose,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const todayOpen =
    location.pathname === "/today" || location.pathname === "/";
  const learningOpen = location.pathname.startsWith("/learning");
  const healthOpen = location.pathname.startsWith("/health");
  const notebooksOpen = location.pathname.startsWith("/notebooks");
  const personalityOpen = location.pathname.startsWith("/personality");
  const todosOpen = location.pathname.startsWith("/todos");
  const reportOpen = location.pathname.startsWith("/report");
  const [learningExpanded, setLearningExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [notebooksExpanded, setNotebooksExpanded] = useState(false);
  const [personalityExpanded, setPersonalityExpanded] = useState(false);
  const [todosExpanded, setTodosExpanded] = useState(true);
  const [reportExpanded, setReportExpanded] = useState(true);

  useEffect(() => {
    if (learningOpen) setLearningExpanded(true);
  }, [learningOpen]);

  async function handleDeleteTodoCategory(e, catId) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this category? Todos will become uncategorized.")) return;
    try {
      await deleteTodoCategory(catId);
      refreshTodoCategories?.();
      if (location.pathname.includes(catId)) navigate("/todos");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#0b0f18]/62 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh min-h-0 w-[min(280px,88vw)] shrink-0 flex-col overflow-hidden border-r border-line/80 bg-[#171c2a] px-4 py-5 shadow-[16px_0_40px_rgba(0,0,0,0.38)] transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-0 lg:h-dvh lg:w-[260px] lg:translate-x-0 lg:bg-[#171c2a]/90 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex shrink-0 items-center gap-2 px-2">
          <NavLink to="/today" className="min-w-0 flex-1" onClick={onClose}>
            <Logo />
          </NavLink>
          <NavLink
            to="/sit25"
            state={{ from: location.pathname }}
            onClick={onClose}
            title="Sit break"
            aria-label="Open 25-minute sit break"
            className="shrink-0 rounded-full ring-teal/0 transition hover:ring-2 hover:ring-teal/40"
          >
            <Sit25Mark title="" />
          </NavLink>
          <span onClick={onClose}>
            <MusicControl />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink lg:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <MusicNowPlaying compact className="mb-4 shrink-0 px-2" />

        <nav
          className="sidebar-nav min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pb-8"
          data-lenis-prevent
        >
          <div>
            <NavLink
              to="/today"
              onClick={onClose}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium ${
                todayOpen
                  ? "bg-teal/12 text-ink ring-1 ring-teal/30"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              Today
            </NavLink>
          </div>

          <div>
            <div
              className={`flex items-center rounded-xl text-sm font-medium ${
                learningOpen
                  ? "bg-teal/12 text-ink ring-1 ring-teal/30"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <NavLink
                to="/learning"
                onClick={() => setLearningExpanded(true)}
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                Learning
              </NavLink>
              {learningExpanded || learningOpen ? (
                <button
                  type="button"
                  aria-label="Collapse Learning"
                  aria-expanded
                  onClick={() => setLearningExpanded(false)}
                  className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                >
                  <ChevronUp />
                </button>
              ) : null}
            </div>

            {learningExpanded ? (
              <div className="mt-2 ml-2 space-y-0.5 border-l border-line pl-3">
                <NavLink
                  to="/learning"
                  end
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-2.5 py-1.5 text-[13px] ${
                      isActive
                        ? "bg-white/8 text-ink"
                        : "text-muted hover:bg-white/5 hover:text-ink"
                    }`
                  }
                >
                  Plan
                </NavLink>
                {subjects.map((subject) => {
                  const inSubject = location.pathname.startsWith(
                    `/learning/${subject.slug}`
                  );
                  return (
                    <div key={subject.slug}>
                      <NavLink
                        to={`/learning/${subject.slug}`}
                        end
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] ${
                            isActive || inSubject
                              ? "bg-white/8 text-ink"
                              : "text-muted hover:bg-white/5 hover:text-ink"
                          }`
                        }
                      >
                        <span>{subject.shortName}</span>
                      </NavLink>
                      {inSubject ? (
                        <div className="ml-2 space-y-0.5 border-l border-line/70 pl-2">
                          <NavLink
                            to={`/learning/${subject.slug}/theory`}
                            className={({ isActive }) =>
                              `block rounded-lg px-2 py-1 text-[12px] ${
                                isActive
                                  ? "text-teal"
                                  : "text-muted hover:text-ink"
                              }`
                            }
                          >
                            Theory
                          </NavLink>
                          <NavLink
                            to={`/learning/${subject.slug}/practical`}
                            className={({ isActive }) =>
                              `block rounded-lg px-2 py-1 text-[12px] ${
                                isActive
                                  ? "text-gold"
                                  : "text-muted hover:text-ink"
                              }`
                            }
                          >
                            Practical
                          </NavLink>
                          {subject.slug === "dsa" ? (
                            <NavLink
                              to="/learning/dsa/namaste-dev"
                              className={({ isActive }) =>
                                `block rounded-lg px-2 py-1 text-[12px] ${
                                  isActive
                                    ? "text-violet"
                                    : "text-muted hover:text-ink"
                                }`
                              }
                            >
                              Namaste Dev
                            </NavLink>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div>
            <div
              className={`flex items-center rounded-xl text-sm font-medium ${
                healthOpen
                  ? "bg-coral/12 text-ink ring-1 ring-coral/30"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <NavLink
                to="/health"
                onClick={() => setHealthExpanded(true)}
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Health
              </NavLink>
              {healthExpanded ? (
                <button
                  type="button"
                  aria-label="Collapse My Health"
                  aria-expanded
                  onClick={() => setHealthExpanded(false)}
                  className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                >
                  <ChevronUp />
                </button>
              ) : null}
            </div>
            {healthExpanded ? (
              <div className="mt-2 ml-2 space-y-0.5 border-l border-line pl-3">
                {healthItems.map((item) => {
                  const inItem = location.pathname.startsWith(item.path);
                  return (
                    <div key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.label === "Exercise"}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] ${
                            isActive || (item.children && inItem)
                              ? "bg-white/8 text-ink"
                              : "text-muted hover:bg-white/5 hover:text-ink"
                          }`
                        }
                      >
                        <span>{item.label}</span>
                      </NavLink>
                      {item.children && inItem ? (
                        <div className="ml-2 space-y-0.5 border-l border-line/70 pl-2">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={({ isActive }) =>
                                `block rounded-lg px-2 py-1 text-[12px] ${
                                  isActive
                                    ? "text-coral"
                                    : "text-muted hover:text-ink"
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div>
            <div
              className={`flex items-center rounded-xl text-sm font-medium ${
                notebooksOpen
                  ? "bg-gold/12 text-ink ring-1 ring-gold/30"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <NavLink
                to="/notebooks"
                onClick={() => setNotebooksExpanded(true)}
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Notebooks
              </NavLink>
              {notebooksExpanded ? (
                <button
                  type="button"
                  aria-label="Collapse My Notebooks"
                  aria-expanded
                  onClick={() => setNotebooksExpanded(false)}
                  className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                >
                  <ChevronUp />
                </button>
              ) : null}
            </div>
            {notebooksExpanded ? (
              <div className="mt-2 ml-2 space-y-0.5 border-l border-line pl-3">
                {books.length === 0 ? (
                  <p className="px-2.5 py-1.5 text-[13px] text-muted">
                    No books yet
                  </p>
                ) : (
                  books.map((book) => (
                    <NavLink
                      key={book._id}
                      to={`/notebooks/${book._id}`}
                      className={({ isActive }) =>
                        `block truncate rounded-lg px-2.5 py-1.5 text-[13px] ${
                          isActive ||
                          location.pathname.startsWith(`/notebooks/${book._id}/`)
                            ? "bg-white/8 text-ink"
                            : "text-muted hover:bg-white/5 hover:text-ink"
                        }`
                      }
                    >
                      {book.title}
                    </NavLink>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div>
            <div
              className={`flex items-center rounded-xl text-sm font-medium ${
                personalityOpen
                  ? "bg-violet/12 text-ink ring-1 ring-violet/30"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <NavLink
                to="/personality/books"
                onClick={() => setPersonalityExpanded(true)}
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Personality
              </NavLink>
              {personalityExpanded ? (
                <button
                  type="button"
                  aria-label="Collapse My Personality"
                  aria-expanded
                  onClick={() => setPersonalityExpanded(false)}
                  className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                >
                  <ChevronUp />
                </button>
              ) : null}
            </div>
            {personalityExpanded ? (
              <div className="mt-2 ml-2 space-y-0.5 border-l border-line pl-3">
                {PERSONALITY_NAV.map((item) => {
                  const inItem = location.pathname.startsWith(
                    `/personality/${item.slug}`
                  );
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={() =>
                        `block rounded-lg px-2.5 py-1.5 text-[13px] ${
                          inItem
                            ? "bg-white/8 text-ink"
                            : "text-muted hover:bg-white/5 hover:text-ink"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* My Todos */}
          <div>
            <div
              className={`flex items-center rounded-xl text-sm font-medium ${
                todosOpen
                  ? "bg-cyan/12 text-ink ring-1 ring-cyan/30"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <NavLink
                to="/todos"
                onClick={() => setTodosExpanded(true)}
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Todos
              </NavLink>
              {todosExpanded ? (
                <button
                  type="button"
                  aria-label="Collapse My Todos"
                  aria-expanded
                  onClick={() => setTodosExpanded(false)}
                  className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                >
                  <ChevronUp />
                </button>
              ) : null}
            </div>

            {todosExpanded ? (
              <div className="mt-2 ml-2 space-y-0.5 border-l border-line pl-3">
                <NavLink
                  to="/todos"
                  end
                  className={({ isActive }) =>
                    `block rounded-lg px-2.5 py-1.5 text-[13px] ${
                      isActive
                        ? "bg-white/8 text-ink"
                        : "text-muted hover:bg-white/5 hover:text-ink"
                    }`
                  }
                >
                  All Todos
                </NavLink>
                {todoCategories.map((cat) => {
                  const inCat = location.pathname === `/todos/category/${cat._id}`;
                  return (
                    <div key={cat._id} className="group/cat flex items-center gap-0.5">
                      <NavLink
                        to={`/todos/category/${cat._id}`}
                        className={() =>
                          `flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                            inCat
                              ? "bg-white/8 text-ink"
                              : "text-muted hover:bg-white/5 hover:text-ink"
                          }`
                        }
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: cat.color }}
                        />
                        <span className="min-w-0 truncate">
                          {cat.emoji ? `${cat.emoji} ` : ""}
                          {cat.name}
                        </span>
                      </NavLink>
                      <div className="flex shrink-0 opacity-0 transition-opacity group-hover/cat:opacity-100">
                        <NavLink
                          to={`/todos?editCategory=${cat._id}`}
                          onClick={onClose}
                          title="Edit category"
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-white/8 hover:text-ink"
                        >
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                            <path
                              d="M11 2l3 3-8 8H3v-3l8-8z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </NavLink>
                        <button
                          type="button"
                          title="Delete category"
                          onClick={(e) => handleDeleteTodoCategory(e, cat._id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-coral/15 hover:text-coral"
                        >
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
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
                })}
                <NavLink
                  to="/todos?new=category"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted hover:bg-white/5 hover:text-cyan"
                >
                  <svg viewBox="0 0 14 14" className="h-3 w-3 shrink-0" fill="none">
                    <path
                      d="M7 2v10M2 7h10"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  New category
                </NavLink>
              </div>
            ) : null}
          </div>

          {/* My Report */}
          <div>
            <div
              className={`flex items-center rounded-xl text-sm font-medium ${
                reportOpen
                  ? "bg-gold/12 text-ink ring-1 ring-gold/30"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <NavLink
                to="/report/statistics"
                onClick={() => setReportExpanded(true)}
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Report
              </NavLink>
              {reportExpanded ? (
                <button
                  type="button"
                  aria-label="Collapse My Report"
                  aria-expanded
                  onClick={() => setReportExpanded(false)}
                  className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                >
                  <ChevronUp />
                </button>
              ) : null}
            </div>

            {reportExpanded ? (
              <div className="mt-2 ml-2 space-y-0.5 border-l border-line pl-3">
                {reportItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `block rounded-lg px-2.5 py-1.5 text-[13px] ${
                        isActive
                          ? "bg-white/8 text-ink"
                          : "text-muted hover:bg-white/5 hover:text-ink"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
        <div className="mt-3 shrink-0 border-t border-line/80 pt-3">
          <LogoutButton onClick={onClose} />
        </div>
      </aside>
    </>
  );
}
