import { Suspense } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Sit25Mark from "../components/Sit25Mark.jsx";
import MusicControl from "../components/MusicControl.jsx";
import { MusicNowPlaying } from "../components/MusicProgress.jsx";

export default function Sit25Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  function close() {
    const target =
      from && !String(from).startsWith("/sit25") ? from : "/learning";
    navigate(target);
  }

  const tabState = from ? { from } : undefined;

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-[#1b2030]">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-[#171c2a]/96 backdrop-blur-md">
        <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:h-16 sm:gap-3 sm:px-5 sm:py-0">
          <Sit25Mark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" title="" />
          <MusicControl className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">
              Sit 25
            </p>
            <p className="truncate text-[11px] text-muted">Then move 5–10 minutes</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close sit break"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-muted hover:border-teal/40 hover:text-ink"
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
        <div className="flex justify-center px-3 pb-2 sm:justify-end sm:px-5 sm:pb-3">
          <nav className="flex shrink-0 rounded-full border border-line bg-[#1b2030] p-0.5 text-xs">
            <NavLink
              to="/sit25"
              end
              state={tabState}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 font-medium ${
                  isActive ? "bg-teal/18 text-ink" : "text-muted hover:text-ink"
                }`
              }
            >
              Break
            </NavLink>
            <NavLink
              to="/sit25/define"
              state={tabState}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 font-medium ${
                  isActive ? "bg-teal/18 text-ink" : "text-muted hover:text-ink"
                }`
              }
            >
              Define
            </NavLink>
          </nav>
        </div>
      </header>
      <MusicNowPlaying
        compact
        className="border-b border-line/80 bg-[#171c2a]/96 px-3 py-2 sm:px-5"
      />
      <main className="min-w-0 flex-1">
        <Suspense fallback={<p className="page-pad text-muted">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
