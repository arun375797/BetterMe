import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PERSONALITY_NAV } from "../personality.js";
import { appLenis } from "./SmoothScroll.jsx";

const STORAGE_KEY = "quick-jump-v1";
const DEFAULT_IDS = [
  "today",
  "learning",
  "health",
  "notebooks",
  "todos",
  "report",
];

export const JUMP_SHORTCUTS = [
  {
    id: "today",
    label: "Today",
    path: "/today",
    color: "#3ce6d4",
    match: (p) => p === "/today" || p === "/",
  },
  {
    id: "learning",
    label: "Learning",
    path: "/learning",
    color: "#3ce6d4",
    match: (p) => p.startsWith("/learning"),
  },
  {
    id: "health",
    label: "Health",
    path: "/health",
    color: "#e88b7a",
    match: (p) => p === "/health",
  },
  {
    id: "food",
    label: "Food",
    path: "/health/food",
    color: "#e88b7a",
    match: (p) => p.startsWith("/health/food"),
  },
  {
    id: "sleep",
    label: "Sleep",
    path: "/health/sleep",
    color: "#6ec8ff",
    match: (p) => p.startsWith("/health/sleep"),
  },
  {
    id: "exercise",
    label: "Exercise",
    path: "/health/exercise",
    color: "#e8c36a",
    match: (p) => p.startsWith("/health/exercise"),
  },
  {
    id: "sugar",
    label: "Sugar",
    path: "/health/sugar",
    color: "#e88b7a",
    match: (p) => p.startsWith("/health/sugar"),
  },
  {
    id: "notebooks",
    label: "Notebooks",
    path: "/notebooks",
    color: "#6ec8ff",
    match: (p) => p.startsWith("/notebooks"),
  },
  {
    id: "personality",
    label: "Personality",
    path: "/personality/english",
    color: "#b9a6ff",
    match: (p) => p.startsWith("/personality"),
  },
  {
    id: "todos",
    label: "Todos",
    path: "/todos",
    color: "#e8c36a",
    match: (p) => p.startsWith("/todos"),
  },
  {
    id: "report",
    label: "Report",
    path: "/report/statistics",
    color: "#e8c36a",
    match: (p) => p.startsWith("/report"),
  },
  {
    id: "sit25",
    label: "Sit break",
    path: "/sit25",
    color: "#3ce6d4",
    match: (p) => p.startsWith("/sit25"),
  },
  {
    id: "music",
    label: "Music",
    path: "/music",
    color: "#b9a6ff",
    match: (p) => p.startsWith("/music"),
  },
];

const HEALTH_SUBS = [
  { id: "health-home", label: "Overview", path: "/health" },
  { id: "sugar", label: "Sugar", path: "/health/sugar" },
  { id: "exercise", label: "Exercise", path: "/health/exercise" },
  { id: "vitamin", label: "Vitamin", path: "/health/vitamin" },
  { id: "food", label: "Food", path: "/health/food" },
  { id: "sleep", label: "Sleep", path: "/health/sleep" },
];

const CATALOG = Object.fromEntries(
  JUMP_SHORTCUTS.map((item) => [item.id, item])
);

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function clampPos(x, y, w, h) {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - w - pad);
  const maxY = Math.max(pad, window.innerHeight - h - pad);
  return {
    x: Math.min(maxX, Math.max(pad, x)),
    y: Math.min(maxY, Math.max(pad, y)),
  };
}

function defaultDock(h) {
  return {
    edge: "right",
    inset: 14,
    y: Math.max(8, (window.innerHeight - h) / 2),
  };
}

function collectPageJumps() {
  return [...document.querySelectorAll("[data-jump]")].map((el, i) => ({
    id: el.id || `page-${i}`,
    label: el.getAttribute("data-jump") || el.id || `Section ${i + 1}`,
    el,
  }));
}

function IconGlyph({ id }) {
  const common = {
    viewBox: "0 0 20 20",
    fill: "none",
    className: "h-3.5 w-3.5",
    "aria-hidden": true,
  };
  if (id === "today") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "learning") {
    return (
      <svg {...common}>
        <path d="M3 15V6.5L10 4l7 2.5V15" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10 8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "health" || id === "food") {
    return (
      <svg {...common}>
        <path d="M10 17s-6-3.8-6-8a3.4 3.4 0 016-2 3.4 3.4 0 016 2c0 4.2-6 8-6 8z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "sleep") {
    return (
      <svg {...common}>
        <path d="M13 4.5A6 6 0 108 16.2 6.2 6.2 0 0016 10c0-1.2-.3-2.3-.9-3.3A4.6 4.6 0 0113 4.5z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "exercise") {
    return (
      <svg {...common}>
        <path d="M4 10h12M7 7v6M13 7v6M3 8.5v3M17 8.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "sugar") {
    return (
      <svg {...common}>
        <path d="M7 3h6l3 7-6 7-6-7 3-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "notebooks") {
    return (
      <svg {...common}>
        <path d="M5 3.5h10v13H5z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 3.5v13" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "personality") {
    return (
      <svg {...common}>
        <circle cx="10" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 16c1.2-3 3.2-4.5 5.5-4.5S14.3 13 15.5 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "todos") {
    return (
      <svg {...common}>
        <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "report") {
    return (
      <svg {...common}>
        <path d="M4 14V8m4 6V5m4 9v-4m4 4V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "sit25") {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 6.5V10l2.4 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "music") {
    return (
      <svg {...common}>
        <path d="M8 15.5V6.5l8-2v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="6.5" cy="15.5" r="1.7" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="14.5" cy="13.5" r="1.7" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="10" cy="10" r="3" fill="currentColor" />
    </svg>
  );
}

export default function QuickJump({ subjects = [], todoCategories = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const skipClickRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    const saved = loadPrefs();
    return {
      ids: saved?.ids?.length ? saved.ids : DEFAULT_IDS,
      collapsed:
        saved?.collapsed ??
        (typeof window !== "undefined" && window.innerWidth < 768),
      showPage: saved?.showPage !== false,
      edge: saved?.edge === "left" ? "left" : "right",
      inset:
        saved?.inset ??
        (saved?.x == null
          ? 14
          : Math.max(8, window.innerWidth - saved.x - 72)),
      y: saved?.y ?? null,
    };
  });
  const [pageJumps, setPageJumps] = useState([]);
  const [activePage, setActivePage] = useState("");
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const shortcuts = useMemo(
    () => prefs.ids.map((id) => CATALOG[id]).filter(Boolean),
    [prefs.ids]
  );

  const nested = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/learning")) {
      return [
        { id: "learn-plan", label: "Plan", path: "/learning" },
        ...subjects.map((subject) => ({
          id: `learn-${subject.slug}`,
          label: subject.shortName || subject.name,
          path: `/learning/${subject.slug}`,
        })),
      ];
    }
    if (path.startsWith("/health")) {
      return HEALTH_SUBS;
    }
    if (path.startsWith("/todos")) {
      return [
        { id: "todos-all", label: "All todos", path: "/todos" },
        ...todoCategories.map((cat) => ({
          id: `todo-${cat._id}`,
          label: cat.name,
          path: `/todos/category/${cat._id}`,
        })),
      ];
    }
    if (path.startsWith("/personality")) {
      return PERSONALITY_NAV.map((item) => ({
        id: `p-${item.slug || item.path}`,
        label: item.label,
        path: item.path,
      }));
    }
    if (path.startsWith("/notebooks")) {
      return [{ id: "nb-home", label: "All notebooks", path: "/notebooks" }];
    }
    if (path.startsWith("/report")) {
      return [{ id: "report-stats", label: "Statistics", path: "/report/statistics" }];
    }
    return [];
  }, [location.pathname, subjects, todoCategories]);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    let timer;
    function scan() {
      const next = collectPageJumps();
      setPageJumps((prev) => {
        const same =
          prev.length === next.length &&
          prev.every(
            (item, i) =>
              item.id === next[i].id &&
              item.label === next[i].label &&
              item.el === next[i].el
          );
        return same ? prev : next;
      });
    }
    function scheduled() {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 50);
    }
    scan();
    const later = [120, 400, 1000].map((ms) => window.setTimeout(scan, ms));
    const root = document.querySelector("main") || document.body;
    const observer = new MutationObserver(scheduled);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-jump", "id"],
    });
    const onLoad = () => appLenis.current?.resize?.();
    later.push(window.setTimeout(onLoad, 300), window.setTimeout(onLoad, 1200));
    return () => {
      window.clearTimeout(timer);
      later.forEach((id) => window.clearTimeout(id));
      observer.disconnect();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!pageJumps.length) {
      setActivePage("");
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target) {
          setActivePage(
            visible.target.id || visible.target.getAttribute("data-jump") || ""
          );
        }
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.1, 0.35, 0.7] }
    );
    pageJumps.forEach((item) => observer.observe(item.el));
    return () => observer.disconnect();
  }, [pageJumps]);

  useEffect(() => {
    function onResize() {
      const el = rootRef.current;
      if (!el) return;
      const h = el.offsetHeight;
      const w = el.offsetWidth;
      const y = Math.min(
        Math.max(8, prefs.y ?? (window.innerHeight - h) / 2),
        Math.max(8, window.innerHeight - h - 8)
      );
      const inset = Math.min(
        Math.max(8, prefs.inset ?? 14),
        Math.max(8, window.innerWidth - w - 8)
      );
      setPrefs((prev) =>
        prev.y === y && prev.inset === inset ? prev : { ...prev, y, inset }
      );
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [prefs.y, prefs.inset]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    const y = Math.min(
      Math.max(8, prefs.y ?? (window.innerHeight - h) / 2),
      Math.max(8, window.innerHeight - h - 8)
    );
    const inset = Math.min(
      Math.max(8, prefs.inset ?? 14),
      Math.max(8, window.innerWidth - w - 8)
    );
    el.style.top = `${y}px`;
    if (prefs.edge === "left") {
      el.style.right = "auto";
      el.style.left = `${inset}px`;
    } else {
      el.style.left = "auto";
      el.style.right = `${inset}px`;
    }
    setReady(true);
  }, [
    prefs.edge,
    prefs.inset,
    prefs.y,
    prefs.collapsed,
    open,
    pageJumps.length,
    nested.length,
    shortcuts.length,
  ]);

  function startDrag(event) {
    if (event.button != null && event.button !== 0) return;
    if (event.detail > 1) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
      captured: false,
    };
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    const el = rootRef.current;
    if (!drag || !el) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 10) {
      drag.moved = true;
      el.setPointerCapture?.(event.pointerId);
      drag.captured = true;
      setDragging(true);
    }
    if (!drag.moved) return;
    event.preventDefault();
    const next = clampPos(
      drag.originX + dx,
      drag.originY + dy,
      el.offsetWidth,
      el.offsetHeight
    );
    el.style.right = "auto";
    el.style.left = `${next.x}px`;
    el.style.top = `${next.y}px`;
  }

  function endDrag(event) {
    const drag = dragRef.current;
    const el = rootRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!drag || !el) return;
    if (event.pointerId != null) {
      try {
        el.releasePointerCapture?.(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (!drag.moved) return;
    skipClickRef.current = true;
    const rect = el.getBoundingClientRect();
    let left = rect.left;
    const top = rect.top;
    const edge =
      left + rect.width / 2 > window.innerWidth / 2 ? "right" : "left";
    if (edge === "right" && window.innerWidth - rect.right < 36) {
      left = window.innerWidth - rect.width - 14;
    } else if (edge === "left" && rect.left < 36) {
      left = 14;
    }
    const next = clampPos(left, top, rect.width, rect.height);
    const inset =
      edge === "right" ? window.innerWidth - (next.x + rect.width) : next.x;
    setPrefs((prev) => ({ ...prev, edge, inset, y: next.y }));
  }

  function getLenis() {
    const lenis = appLenis.current;
    lenis?.resize?.();
    return lenis;
  }

  function scrollToEl(el) {
    if (!el) return;
    const top =
      el.getBoundingClientRect().top +
      (window.scrollY || document.documentElement.scrollTop || 0) -
      28;
    const y = Math.max(0, top);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(y, { duration: 0.85, force: true, programmatic: true });
      return;
    }
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  function goShortcut(item) {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    if (item.match(location.pathname)) {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { duration: 0.7, force: true, programmatic: true });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(item.path);
  }

  function toggleId(id) {
    setPrefs((prev) => {
      if (prev.ids.includes(id)) {
        const ids = prev.ids.filter((item) => item !== id);
        return { ...prev, ids: ids.length ? ids : prev.ids };
      }
      return { ...prev, ids: [...prev.ids, id] };
    });
  }

  function moveId(id, dir) {
    setPrefs((prev) => {
      const ids = [...prev.ids];
      const i = ids.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ids.length) return prev;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      return { ...prev, ids };
    });
  }

  const pageItems = prefs.showPage ? pageJumps : [];
  const onRight = prefs.edge !== "left";

  return (
    <div
      ref={rootRef}
      data-lenis-prevent
      className={`quick-jump ${onRight ? "is-right" : "is-left"} ${
        dragging ? "quick-jump-dragging" : ""
      } ${ready ? "is-ready" : ""}`}
      style={{ position: "fixed", zIndex: 36 }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {prefs.collapsed ? (
        <button
          type="button"
          aria-label="Double-click to open section jumper"
          title="Double-click to open · drag to move"
          onPointerDown={startDrag}
          onClick={() => {
            if (skipClickRef.current) {
              skipClickRef.current = false;
              return;
            }
            setPrefs((prev) => ({ ...prev, collapsed: false }));
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            skipClickRef.current = false;
            setPrefs((prev) => ({ ...prev, collapsed: false }));
          }}
          className="quick-jump-fab"
        >
          <span className="quick-jump-fab-ring" />
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            <circle cx="10" cy="4" r="1.5" fill="currentColor" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <circle cx="10" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <div className="quick-jump-shell">
          <div className="quick-jump-rail">
            {pageItems.length ? (
              <>
                <p className="quick-jump-kicker">Page</p>
                {pageItems.map((item, i) => {
                  const active =
                    activePage === item.id || activePage === item.label;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => {
                        if (skipClickRef.current) {
                          skipClickRef.current = false;
                          return;
                        }
                        scrollToEl(item.el);
                      }}
                      className={`quick-jump-item ${active ? "is-active" : ""}`}
                    >
                      <span
                        className="quick-jump-dot"
                        style={{
                          background: active ? "#3ce6d4" : "transparent",
                          boxShadow: active
                            ? "0 0 10px rgba(60,230,212,0.55)"
                            : "none",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="quick-jump-label">{item.label}</span>
                    </button>
                  );
                })}
                <div className="quick-jump-rule" />
              </>
            ) : null}

            {nested.length ? (
              <>
                <p className="quick-jump-kicker">Sub</p>
                {nested.map((item) => {
                  const exact =
                    item.path === "/learning" ||
                    item.path === "/health" ||
                    item.path === "/todos" ||
                    item.path === "/notebooks";
                  const active = exact
                    ? location.pathname === item.path
                    : location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => {
                        if (skipClickRef.current) {
                          skipClickRef.current = false;
                          return;
                        }
                        navigate(item.path);
                      }}
                      className={`quick-jump-item ${active ? "is-active" : ""}`}
                    >
                      <span className="quick-jump-subdot" aria-hidden="true" />
                      <span className="quick-jump-label">{item.label}</span>
                    </button>
                  );
                })}
                <div className="quick-jump-rule" />
              </>
            ) : null}

            <p className="quick-jump-kicker">Jump</p>
          {shortcuts.map((item) => {
            const active = item.match(location.pathname);
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => goShortcut(item)}
                className={`quick-jump-item ${active ? "is-active" : ""}`}
              >
                <span
                  className="quick-jump-icon"
                  style={{
                    color: item.color,
                    background: active ? `${item.color}22` : "transparent",
                    boxShadow: active ? `0 0 12px ${item.color}55` : "none",
                  }}
                >
                  <IconGlyph id={item.id} />
                </span>
                <span className="quick-jump-label">{item.label}</span>
              </button>
            );
          })}

          <div className="quick-jump-rule" />
          <div className="quick-jump-tools">
            <button
              type="button"
              title="Customize"
              aria-label="Customize jumper"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`quick-jump-tool ${open ? "is-on" : ""}`}
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M8.2 3.4l.4-1.4h2.8l.4 1.4 1.5.7 1.4-.6 2 2-.6 1.4.7 1.5 1.4.4v2.8l-1.4.4-.7 1.5.6 1.4-2 2-1.4-.6-1.5.7-.4 1.4H8.6l-.4-1.4-1.5-.7-1.4.6-2-2 .6-1.4-.7-1.5L2 11.4V8.6l1.4-.4.7-1.5-.6-1.4 2-2 1.4.6 1.3-.5z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
            <button
              type="button"
              title="Collapse"
              aria-label="Collapse jumper"
              onClick={() => {
                setOpen(false);
                setPrefs((prev) => ({ ...prev, collapsed: true }));
              }}
              className="quick-jump-tool"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                <path d="M6 6l8 8M14 6L6 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          </div>
          <button
            type="button"
            aria-label="Drag jumper"
            title="Drag to move · double-click the orb after collapse to open"
            className="quick-jump-grip"
            onPointerDown={startDrag}
          >
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </button>
        </div>
      )}

      {open && !prefs.collapsed ? (
        <div
          className={`quick-jump-panel ${onRight ? "from-right" : "from-left"}`}
          data-lenis-prevent
        >
          <p className="text-[11px] tracking-[0.18em] text-teal uppercase">
            Customize
          </p>
          <h3 className="mt-1 text-sm font-semibold">Section jumper</h3>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            Drag the grip to park it anywhere. Click a row to jump. Tick the
            pages you want on the rail.
          </p>

          <label className="mt-4 flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={prefs.showPage}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, showPage: e.target.checked }))
              }
              className="accent-teal"
            />
            Show on-this-page sections
          </label>

          <div className="mt-3 space-y-1">
            {prefs.ids.map((id, i) => {
              const item = CATALOG[id];
              if (!item) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-1 rounded-lg bg-white/4 px-1.5 py-1"
                >
                  <span className="min-w-0 flex-1 truncate px-1 text-[13px]">
                    {item.label}
                  </span>
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => moveId(id, -1)}
                    className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-white/8 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === prefs.ids.length - 1}
                    onClick={() => moveId(id, 1)}
                    className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-white/8 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={`Hide ${item.label}`}
                    onClick={() => toggleId(id)}
                    className="rounded px-1.5 py-0.5 text-xs text-coral hover:bg-white/8"
                  >
                    Hide
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] tracking-[0.16em] text-muted uppercase">
            Add
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {JUMP_SHORTCUTS.filter((item) => !prefs.ids.includes(item.id)).map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleId(item.id)}
                  className="rounded-full border border-line px-2.5 py-1 text-[12px] text-muted hover:border-teal/40 hover:text-ink"
                >
                  + {item.label}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              const h = rootRef.current?.offsetHeight || 280;
              setPrefs((prev) => ({
                ...prev,
                ids: DEFAULT_IDS,
                showPage: true,
                collapsed: false,
                ...defaultDock(h),
              }));
            }}
            className="mt-4 text-[12px] text-muted hover:text-ink"
          >
            Reset position and list
          </button>
        </div>
      ) : null}
    </div>
  );
}
