import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import Logo from "./Logo.jsx";
import { PERSONALITY_NAV } from "../personality.js";

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
];

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
      aria-hidden="true"
    >
      <path
        d="M5 8l5 5 5-5"
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
  open = false,
  onClose,
}) {
  const location = useLocation();
  const learningOpen = location.pathname.startsWith("/learning");
  const healthOpen = location.pathname.startsWith("/health");
  const notebooksOpen = location.pathname.startsWith("/notebooks");
  const personalityOpen = location.pathname.startsWith("/personality");
  const [learningExpanded, setLearningExpanded] = useState(true);
  const [healthExpanded, setHealthExpanded] = useState(true);
  const [notebooksExpanded, setNotebooksExpanded] = useState(true);
  const [personalityExpanded, setPersonalityExpanded] = useState(true);

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
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(280px,88vw)] shrink-0 flex-col border-r border-line/80 bg-[#171c2a] px-4 py-5 shadow-[16px_0_40px_rgba(0,0,0,0.38)] transition-transform duration-200 ease-out lg:static lg:z-0 lg:h-auto lg:min-h-screen lg:w-[260px] lg:translate-x-0 lg:bg-[#171c2a]/90 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <NavLink to="/learning" className="min-w-0" onClick={onClose}>
            <Logo />
          </NavLink>
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

        <nav className="flex-1 space-y-6 overflow-y-auto" data-lenis-prevent>
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
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                Learning
              </NavLink>
              <button
                type="button"
                aria-label={
                  learningExpanded ? "Collapse Learning" : "Expand Learning"
                }
                aria-expanded={learningExpanded}
                onClick={() => setLearningExpanded((value) => !value)}
                className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
              >
                <Chevron open={learningExpanded} />
              </button>
            </div>

            {learningExpanded ? (
              <div className="mt-2 ml-2 space-y-0.5 border-l border-line pl-3">
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
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Health
              </NavLink>
              <button
                type="button"
                aria-label={
                  healthExpanded ? "Collapse My Health" : "Expand My Health"
                }
                aria-expanded={healthExpanded}
                onClick={() => setHealthExpanded((value) => !value)}
                className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
              >
                <Chevron open={healthExpanded} />
              </button>
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
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Notebooks
              </NavLink>
              <button
                type="button"
                aria-label={
                  notebooksExpanded
                    ? "Collapse My Notebooks"
                    : "Expand My Notebooks"
                }
                aria-expanded={notebooksExpanded}
                onClick={() => setNotebooksExpanded((value) => !value)}
                className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
              >
                <Chevron open={notebooksExpanded} />
              </button>
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
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5"
              >
                My Personality
              </NavLink>
              <button
                type="button"
                aria-label={
                  personalityExpanded
                    ? "Collapse My Personality"
                    : "Expand My Personality"
                }
                aria-expanded={personalityExpanded}
                onClick={() => setPersonalityExpanded((value) => !value)}
                className="mr-1.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
              >
                <Chevron open={personalityExpanded} />
              </button>
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
        </nav>
      </aside>
    </>
  );
}
