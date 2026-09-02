import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { getTopic, peekTopic, updateTopic, createTopic } from "../api.js";
import { DIFFICULTIES, difficultyMeta } from "../difficulty.js";
import {
  emptyNotebook,
  highlightCode,
  newBlock,
  notebookHasContent,
  normalizeNotebook,
  readLocalNotebook,
  writeLocalNotebook,
} from "../notebook.js";
import { accentMap } from "../theme.jsx";

const FONT_SIZES = [14, 16, 18, 22, 26];
const NB_THEME_KEY = "notebook-paper-theme";
const NB_THEMES = [
  { id: "vintage", label: "Vintage" },
  { id: "romino", label: "Romino" },
  { id: "bw", label: "Black & white" },
];

function readNbTheme() {
  try {
    const saved = localStorage.getItem(NB_THEME_KEY);
    if (NB_THEMES.some((item) => item.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "vintage";
}
const HIGHLIGHTS = [
  { id: "gold", color: "#ffe08a" },
  { id: "teal", color: "#9af0e4" },
  { id: "coral", color: "#ffc2b6" },
];
const LANGS = ["javascript", "html", "css", "json", "python", "text"];

function normalizeUrlForHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)) return raw;
  return `https://${raw}`;
}

function linePx(el) {
  const paper = el?.closest?.(".notebook-paper");
  const raw = paper
    ? getComputedStyle(paper).getPropertyValue("--nb-line")
    : "";
  const n = parseFloat(raw);
  return n > 0 ? n : 32;
}

function lineBlocks(el) {
  return [...el.children].filter((node) =>
    ["DIV", "P", "LI"].includes(node.tagName)
  );
}

function padToLine(el, lineIndex) {
  let kids = lineBlocks(el);
  if (kids.length === 0) {
    const wrap = document.createElement("div");
    wrap.appendChild(document.createElement("br"));
    el.innerHTML = "";
    el.appendChild(wrap);
    kids = [wrap];
  }
  while (kids.length <= lineIndex) {
    const row = document.createElement("div");
    row.appendChild(document.createElement("br"));
    el.appendChild(row);
    kids.push(row);
  }
  return kids[lineIndex];
}

function placeCaret(node) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function jumpToClickedLine(el, clientY) {
  const rect = el.getBoundingClientRect();
  const padTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
  const y = clientY - rect.top - padTop;
  const lineIndex = Math.max(0, Math.floor(y / linePx(el)));
  const filled = Math.max(1, lineBlocks(el).length);
  if (lineIndex < filled) return false;
  const target = padToLine(el, lineIndex);
  el.focus();
  placeCaret(target);
  return true;
}

function TextBlock({ id, html, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html || "<div><br></div>";
  }, []);

  return (
    <div
      ref={ref}
      data-block-id={id}
      contentEditable
      suppressContentEditableWarning
      className="notebook-write"
      onMouseDown={(e) => {
        if (jumpToClickedLine(ref.current, e.clientY)) {
          e.preventDefault();
          onChange(ref.current.innerHTML);
        }
      }}
      onInput={() => onChange(ref.current?.innerHTML || "")}
      onBlur={() => onChange(ref.current?.innerHTML || "")}
    />
  );
}

export default function NotebookPage() {
  const { slug, section, topicId, subId } = useParams();
  const noteId = subId && subId !== "answer" ? subId : topicId;
  const { refreshSubjects } = useOutletContext();
  const [sub, setSub] = useState(null);
  const [error, setError] = useState("");
  const [notebook, setNotebook] = useState(emptyNotebook());
  const [editingCode, setEditingCode] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [nested, setNested] = useState([]);
  const [showFromNote, setShowFromNote] = useState(false);
  const [selText, setSelText] = useState("");
  const [youtubeUrlDraft, setYoutubeUrlDraft] = useState("");
  const [paperTheme, setPaperTheme] = useState(readNbTheme);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const paperRef = useRef(null);
  const savedRangeRef = useRef(null);

  function changePaperTheme(id) {
    setPaperTheme(id);
    try {
      localStorage.setItem(NB_THEME_KEY, id);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const cached = peekTopic(noteId);
    if (cached) {
      setSub(cached);
      setNested(cached.nested || []);
      setYoutubeUrlDraft(cached.youtubeUrl || "");
      const fromApi = normalizeNotebook(cached.notebook);
      const local = readLocalNotebook(noteId);
      const next = notebookHasContent(fromApi) || !local ? fromApi : local;
      setNotebook(next);
    } else {
      setSub(null);
    }
    getTopic(noteId)
      .then((data) => {
        setSub(data);
        setNested(data.nested || []);
        setYoutubeUrlDraft(data.youtubeUrl || "");
        const fromApi = normalizeNotebook(data.notebook);
        const local = readLocalNotebook(noteId);
        const next =
          notebookHasContent(fromApi) || !local ? fromApi : local;
        setNotebook(next);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [noteId]);

  useEffect(() => {
    function syncSelection() {
      const text = window.getSelection()?.toString().replace(/\s+/g, " ").trim() || "";
      setSelText(text.slice(0, 80));
    }
    document.addEventListener("selectionchange", syncSelection);
    return () => document.removeEventListener("selectionchange", syncSelection);
  }, []);

  function updateBlock(id, patch) {
    setNotebook((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === id ? { ...block, ...patch } : block
      ),
    }));
  }

  function applyHighlight(color) {
    document.execCommand("hiliteColor", false, color);
  }

  function flushNoteHtml() {
    paperRef.current?.querySelectorAll("[data-block-id]").forEach((node) => {
      const id = node.getAttribute("data-block-id");
      if (id) updateBlock(id, { html: node.innerHTML });
    });
  }

  function applyFontSize(px) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !String(sel).trim()) {
      setStatus("Select the words first, then pick a size");
      setTimeout(() => setStatus(""), 1800);
      return;
    }
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, "7");
    const root = paperRef.current;
    const tagged = [
      ...(root?.querySelectorAll('font[size="7"]') || []),
      ...(root?.querySelectorAll('span[style*="xxx-large"]') || []),
    ];
    tagged.forEach((el) => {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      span.style.lineHeight = "var(--nb-line)";
      while (el.firstChild) span.appendChild(el.firstChild);
      el.replaceWith(span);
    });
    flushNoteHtml();
  }

  function applyList(type) {
    document.execCommand(
      type === "ul" ? "insertUnorderedList" : "insertOrderedList",
      false,
      null
    );
  }

  const DIFFICULTY_HIGHLIGHT = {
    easy: "#b5f7e8",
    medium: "#ffe08a",
    hard: "#ffc2b6",
    ec: "#bae6fd",
  };

  function applyDifficulty(id) {
    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && String(sel).trim().length > 0;
    if (hasSelection) {
      document.execCommand("hiliteColor", false, DIFFICULTY_HIGHLIGHT[id]);
      flushNoteHtml();
    }
    patchMeta({ difficulty: id });
  }

  function openLinkModal(e) {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    setLinkUrl("");
    setLinkModalOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!url) return;
    const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const editor = paperRef.current?.querySelector("[data-block-id]");
    editor?.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand("createLink", false, fullUrl);
    paperRef.current?.querySelectorAll(`a[href="${fullUrl}"]`).forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    flushNoteHtml();
    setLinkModalOpen(false);
  }

  function handlePaperClick(e) {
    const anchor = e.target.closest("a[href]");
    if (anchor) {
      e.preventDefault();
      window.open(anchor.href, "_blank", "noopener,noreferrer");
    }
  }

  function noteTitleKey(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  async function addSelectionAsSubtopic() {
    const text = window.getSelection()?.toString().replace(/\s+/g, " ").trim();
    if (!text) {
      setStatus("Select a word in the notebook first");
      return;
    }
    const title = text.slice(0, 80);
    try {
      const result = await createTopic({
        subjectSlug: slug,
        parentId: noteId,
        title,
        section: section || "theory",
        fromNote: true,
      });
      if (result.removed) {
        const gone = new Set((result.ids || []).map(String));
        setNested((prev) =>
          prev.filter(
            (item) =>
              !gone.has(String(item._id)) &&
              noteTitleKey(item.title) !== noteTitleKey(title)
          )
        );
        setStatus(`Removed from subtopics: ${title.slice(0, 40)}`);
      } else {
        setNested((prev) => {
          const key = noteTitleKey(result.title);
          if (prev.some((item) => noteTitleKey(item.title) === key)) {
            return prev;
          }
          return [...prev, result];
        });
        setShowFromNote(true);
        setStatus(`Added under this subtopic: ${title.slice(0, 40)}`);
      }
      await refreshSubjects();
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function patchMeta(updates) {
    setSub((prev) => (prev ? { ...prev, ...updates } : prev));
    try {
      await updateTopic(noteId, updates);
      await refreshSubjects();
      setStatus("Saved");
      setTimeout(() => setStatus(""), 1600);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function saveYoutubeUrl() {
    const normalized = normalizeUrlForHref(youtubeUrlDraft);
    setYoutubeUrlDraft(normalized);
    await patchMeta({ youtubeUrl: normalized });
  }

  function collectNotebook() {
    const nodes = paperRef.current?.querySelectorAll("[data-block-id]");
    const htmlById = {};
    nodes?.forEach((node) => {
      htmlById[node.getAttribute("data-block-id")] = node.innerHTML;
    });
    return {
      ...notebook,
      blocks: notebook.blocks.map((block) =>
        block.type === "text" && htmlById[block.id] !== undefined
          ? { ...block, html: htmlById[block.id] }
          : block
      ),
    };
  }

  async function save() {
    const payload = collectNotebook();
    setNotebook(payload);
    writeLocalNotebook(noteId, payload);
    setSaving(true);
    try {
      await updateTopic(noteId, { notebook: payload });
      setStatus("Saved");
      setTimeout(() => setStatus(""), 1600);
    } catch (err) {
      setStatus(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }

  if (!sub) {
    return <p className="p-8 text-muted">Loading notebook…</p>;
  }

  const accent = accentMap[sub.subject?.accent] || accentMap.gold;
  const isMainTopic = !sub.parent && !sub.parentTopic;
  const parentTitle = sub.parentTopic?.title || "Topic";
  const alreadyFromNote = nested.some(
    (item) => noteTitleKey(item.title) === noteTitleKey(selText)
  );
  const youtubeHref = normalizeUrlForHref(sub.youtubeUrl || youtubeUrlDraft);

  return (
    <div className="page-pad min-h-screen">
      <p className={`text-[12px] tracking-[0.18em] uppercase ${accent.text}`}>
        <Link to={`/learning/${slug}`} className="hover:underline">
          {sub.subject?.shortName || slug}
        </Link>
        {" · "}
          <Link to={`/learning/${slug}/${section}`} className="hover:underline">
            {section === "practical" ? "Practical" : "Theory"}
          </Link>
        {isMainTopic ? (
          <>
            {" · "}
            <Link
              to={`/learning/${slug}/${section}/${topicId}`}
              className="hover:underline"
            >
              {sub.title}
            </Link>
          </>
        ) : (
          <>
            {" · "}
            <Link
              to={`/learning/${slug}/${section}/${topicId}`}
              className="hover:underline"
            >
              {parentTitle}
            </Link>
          </>
        )}
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <h2 className="min-w-0 max-w-full flex-1 text-2xl font-semibold break-words sm:text-3xl">
            {sub.title}
          </h2>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${
              difficultyMeta(sub.difficulty).className
            }`}
          >
            {difficultyMeta(sub.difficulty).label}
          </span>
          {sub.inReview ? (
            <span className="shrink-0 rounded-full border border-teal/30 bg-teal/12 px-2.5 py-0.5 text-[11px] text-teal">
              In review
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {status ? <span className="text-xs text-teal">{status}</span> : null}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-[#10201e] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-4 max-w-4xl rounded-2xl border border-line bg-[#222838]/80 px-4 py-3">
        <p className="text-[11px] tracking-[0.18em] text-muted uppercase">
          Video link (clickable)
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={youtubeUrlDraft}
            onChange={(e) => setYoutubeUrlDraft(e.target.value)}
            placeholder="Paste YouTube link here"
            className="min-w-[220px] flex-1 rounded-xl border border-line bg-[#171c2a] px-4 py-2 text-sm outline-none placeholder:text-muted/70 focus:border-teal/50"
          />
          <button
            type="button"
            onClick={saveYoutubeUrl}
            className="rounded-xl border border-line bg-white/5 px-4 py-2 text-sm"
          >
            Save link
          </button>
          {youtubeHref ? (
            <a
              href={youtubeHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#2a2410]"
            >
              Watch video →
            </a>
          ) : null}
          {youtubeHref ? (
            <a
              href={youtubeHref}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 break-all text-xs text-cyan hover:underline"
            >
              {youtubeHref}
            </a>
          ) : (
            <span className="text-xs text-muted">No link yet.</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted">From this note:</span>
        <span className="text-[11px] text-gold">{nested.length}</span>
        <button
          type="button"
          onClick={() => setShowFromNote((open) => !open)}
          className="rounded-lg border border-line px-2 py-1 text-[11px] text-cyan"
        >
          {showFromNote ? "Hide" : "View more"}
        </button>
      </div>
      {showFromNote ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {nested.length ? (
            nested.map((item) => (
              <span
                key={item._id}
                className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold"
              >
                {item.title}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-muted">
              Select text and click Add to subtopic. Click again to remove it.
            </span>
          )}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#1c2133] px-3 py-2.5">
        <span className="text-[11px] font-medium text-[#8d95aa] uppercase tracking-wide">Size</span>
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            title="Select text, then click a size"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFontSize(size)}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-[#c8cfe0] hover:bg-white/10 hover:text-white"
          >
            {size}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-white/15" />
        <span className="text-[11px] font-medium text-[#8d95aa] uppercase tracking-wide">Highlight</span>
        {HIGHLIGHTS.map((item) => (
          <button
            key={item.id}
            type="button"
            title={`Highlight ${item.id}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight(item.color)}
            className="h-6 w-6 rounded-full border-2 border-white/30 shadow-sm hover:scale-110 transition-transform"
            style={{ background: item.color }}
          />
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand("removeFormat")}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-[#c8cfe0] hover:bg-white/10 hover:text-white"
        >
          Clear mark
        </button>
        <span className="mx-1 h-4 w-px bg-white/15" />
        <button
          type="button"
          title="Bullet list"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyList("ul")}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-[#c8cfe0] hover:bg-white/10 hover:text-white"
        >
          • List
        </button>
        <button
          type="button"
          title="Numbered list"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyList("ol")}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-[#c8cfe0] hover:bg-white/10 hover:text-white"
        >
          1. List
        </button>
        <button
          type="button"
          title="Select text and click to insert a hyperlink"
          onMouseDown={openLinkModal}
          className="rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[11px] text-cyan hover:bg-cyan/20"
        >
          🔗 Link
        </button>
        <span className="mx-1 h-4 w-px bg-white/15" />
        <span className="text-[11px] font-medium text-[#8d95aa] uppercase tracking-wide">Paper</span>
        {NB_THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changePaperTheme(item.id)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
              paperTheme === item.id
                ? "border-teal/50 bg-teal/20 text-teal"
                : "border-white/15 bg-white/5 text-[#c8cfe0] hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-white/15" />
        <span className="text-[11px] font-medium text-[#8d95aa] uppercase tracking-wide">Difficulty</span>
        {DIFFICULTIES.map((item) => (
          <button
            key={item.id}
            type="button"
            title={`Set difficulty to ${item.label}. Select text first to also highlight it.`}
            onClick={() => applyDifficulty(item.id)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
              (sub.difficulty || "medium") === item.id
                ? item.className
                : "border-white/15 bg-white/5 text-[#c8cfe0] hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-white/15" />
        {isMainTopic ? null : (
        <button
          type="button"
          title="Select text in the notebook, then add it as a nested subtopic. Click again to remove it."
          onMouseDown={(e) => e.preventDefault()}
          onClick={addSelectionAsSubtopic}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
            alreadyFromNote
              ? "border-gold/50 bg-gold/25 text-gold"
              : "border-gold/40 bg-gold/12 text-gold hover:bg-gold/20"
          }`}
        >
          {alreadyFromNote ? "✓ Added as subtopic" : "Add to subtopic"}
        </button>
        )}
        <button
          type="button"
          onClick={() => patchMeta({ inReview: !sub.inReview })}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
            sub.inReview
              ? "border-teal/50 bg-teal/20 text-teal"
              : "border-white/15 bg-white/5 text-[#c8cfe0] hover:bg-white/10 hover:text-white"
          }`}
        >
          {sub.inReview ? "✓ In review" : "Add to review"}
        </button>
        <button
          type="button"
          onClick={() =>
            setNotebook((prev) => ({
              ...prev,
              blocks: [...prev.blocks, newBlock("text")],
            }))
          }
          className="ml-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-[#c8cfe0] hover:bg-white/10 hover:text-white"
        >
          Add note
        </button>
        <button
          type="button"
          onClick={() =>
            setNotebook((prev) => ({
              ...prev,
              blocks: [...prev.blocks, newBlock("code")],
            }))
          }
          className="rounded-lg border border-teal/40 bg-teal/15 px-3 py-1 text-[11px] font-medium text-teal hover:bg-teal/25"
        >
          Add code
        </button>
      </div>

      <div
        ref={paperRef}
        data-nb-theme={paperTheme}
        className="notebook-paper mt-5 min-h-[70vh] overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
        style={{ fontSize: "18px" }}
        onClick={handlePaperClick}
        onMouseDown={(e) => {
          if (
            e.target.closest(
              ".notebook-code, button, select, textarea, pre, .notebook-head"
            )
          ) {
            return;
          }
          const editor = paperRef.current?.querySelector(".notebook-write");
          if (!editor || editor.contains(e.target)) return;
          if (jumpToClickedLine(editor, e.clientY)) {
            e.preventDefault();
            updateBlock(editor.getAttribute("data-block-id"), {
              html: editor.innerHTML,
            });
          }
        }}
      >
        <div className="notebook-head">Notebook</div>
        <div>
          {notebook.blocks.map((block) =>
            block.type === "code" ? (
              <div key={block.id} className="notebook-code">
                <div className="mb-2 flex items-center gap-2" style={{ lineHeight: "var(--nb-line)" }}>
                  <select
                    value={block.language}
                    onChange={(e) =>
                      updateBlock(block.id, { language: e.target.value })
                    }
                    className="nb-control rounded-md border px-2 py-1 text-xs"
                  >
                    {LANGS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setNotebook((prev) => ({
                        ...prev,
                        blocks: prev.blocks.filter((item) => item.id !== block.id),
                      }))
                    }
                    className="nb-remove text-xs"
                  >
                    remove
                  </button>
                </div>
                {editingCode === block.id ? (
                  <textarea
                    autoFocus
                    value={block.code}
                    onChange={(e) =>
                      updateBlock(block.id, { code: e.target.value })
                    }
                    onBlur={() => setEditingCode(null)}
                    rows={Math.max(4, (block.code || "").split("\n").length + 1)}
                    className="code-block w-full rounded-xl bg-[#1a2030] p-4 text-sm leading-6 text-[#e9edf4] outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <pre
                    onClick={() => setEditingCode(block.id)}
                    className="code-block cursor-text overflow-x-auto rounded-xl bg-[#1a2030] p-4 text-sm leading-6 text-[#e9edf4]"
                    dangerouslySetInnerHTML={{
                      __html:
                        highlightCode(block.code) ||
                        '<span class="code-tok-cmt">// click to write code</span>',
                    }}
                  />
                )}
              </div>
            ) : (
              <div key={block.id} className="relative">
                {notebook.blocks.filter((item) => item.type === "text").length >
                1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setNotebook((prev) => ({
                        ...prev,
                        blocks: prev.blocks.filter((item) => item.id !== block.id),
                      }))
                    }
                    className="nb-remove absolute top-0 right-4 z-10 text-[11px]"
                  >
                    remove
                  </button>
                ) : null}
                <TextBlock
                  id={block.id}
                  html={block.html}
                  onChange={(html) => updateBlock(block.id, { html })}
                />
              </div>
            )
          )}
        </div>
      </div>
      {linkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#1c2133] p-6 shadow-2xl">
            <h3 className="mb-1 text-sm font-semibold text-ink">Insert hyperlink</h3>
            <p className="mb-4 text-xs text-muted">Select text first, then paste any URL. Clicking the link will open it in a new tab.</p>
            <input
              autoFocus
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") setLinkModalOpen(false);
              }}
              className="w-full rounded-xl border border-white/15 bg-[#222838] px-3 py-2 text-sm text-ink outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="rounded-xl border border-white/15 px-4 py-1.5 text-sm text-muted hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyLink}
                className="rounded-xl bg-cyan px-4 py-1.5 text-sm font-semibold text-[#0d1a1f]"
              >
                Insert link
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
