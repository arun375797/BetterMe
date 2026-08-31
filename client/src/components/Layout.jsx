import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Logo from "./Logo.jsx";
import {
  getBooks,
  getSubjects,
  getTodoCategories,
  peekBooks,
  peekSubjects,
  peekTodoCategories,
} from "../api.js";
import { prefetchPath } from "../prefetch.js";

export default function Layout() {
  const location = useLocation();
  const [subjects, setSubjects] = useState(() => peekSubjects() || []);
  const [books, setBooks] = useState(() => peekBooks() || []);
  const [todoCategories, setTodoCategories] = useState(
    () => peekTodoCategories() || []
  );
  const [error, setError] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  async function refreshSubjects() {
    try {
      const data = await getSubjects();
      setSubjects(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshBooks() {
    try {
      const data = await getBooks();
      setBooks(data.books || []);
    } catch {
      setBooks([]);
    }
  }

  async function refreshTodoCategories() {
    try {
      const data = await getTodoCategories();
      setTodoCategories(data.categories || []);
    } catch {
      setTodoCategories([]);
    }
  }

  useEffect(() => {
    refreshSubjects();
    refreshBooks();
    refreshTodoCategories();
  }, []);

  useEffect(() => {
    function onIntent(event) {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      try {
        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        prefetchPath(url.pathname);
      } catch {
        /* ignore */
      }
    }
    document.addEventListener("pointerover", onIntent, true);
    document.addEventListener("touchstart", onIntent, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("pointerover", onIntent, true);
      document.removeEventListener("touchstart", onIntent, true);
    };
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div className="flex min-h-dvh min-w-0">
      <Sidebar
        subjects={subjects}
        books={books}
        todoCategories={todoCategories}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line/80 bg-[#171c2a]/94 px-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/5 text-ink"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M4 6h12M4 10h12M4 14h12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Link to="/learning" className="min-w-0 flex-1">
            <Logo iconClass="h-7 w-7" />
          </Link>
        </header>
        <main className="min-w-0 flex-1">
          {error ? (
            <div className="page-pad">
              <div className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
                Could not reach the API. Check that the Railway backend is
                online, then refresh. ({error})
              </div>
            </div>
          ) : null}
          <Suspense fallback={<p className="page-pad text-muted">Loading…</p>}>
            <Outlet
              context={{
                subjects,
                refreshSubjects,
                books,
                refreshBooks,
                todoCategories,
                refreshTodoCategories,
              }}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
