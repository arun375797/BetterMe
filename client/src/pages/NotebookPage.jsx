import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { getTopic, updateTopic, createTopic } from "../api.js";
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

const LINE_PX = 32;

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
  const lineIndex = Math.max(0, Math.floor(y / LINE_PX));
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
  const { refreshSubjects } = useOutletContext();
  const [sub, setSub] = useState(null);
  const [error, setError] = useState("");
  const [notebook, setNotebook] = useState(emptyNotebook());
  const [editingCode, setEditingCode] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [nested, setNested] = useState([]);
  const [paperTheme, setPaperTheme] = useState(readNbTheme);
  const paperRef = useRef(null);

  function changePaperTheme(id) {
    setPaperTheme(id);
    try {
      localStorage.setItem(NB_THEME_KEY, id);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setSub(null);
    getTopic(subId)
      .then((data) => {
        setSub(data);
        setNested(data.nested || []);
        const fromApi = normalizeNotebook(data.notebook);
        const local = readLocalNotebook(subId);
        const next =
          notebookHasContent(fromApi) || !local ? fromApi : local;
        setNotebook(next);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [subId]);

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
      while (el.firstChild) span.appendChild(el.firstChild);
      el.replaceWith(span);
    });
    flushNoteHtml();
  }

  async function addSelectionAsSubtopic() {
    const text = window.getSelection()?.toString().replace(/\s+/g, " ").trim();
    if (!text) {
      setStatus("Select a word in the notebook first");
      return;
    }
    try {
      const created = await createTopic({
        subjectSlug: slug,
        parentId: subId,
        title: text.slice(0, 80),
        section: section || "theory",
        fromNote: true,
      });
      setNested((prev) => [...prev, created]);
      await refreshSubjects();
      setStatus(`Added under this subtopic: ${text.slice(0, 40)}`);
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function patchMeta(updates) {
    setSub((prev) => (prev ? { ...prev, ...updates } : prev));
    try {
      await updateTopic(subId, updates);
      await refreshSubjects();
      setStatus("Saved");
      setTimeout(() => setStatus(""), 1600);
    } catch (err) {
      setStatus(err.message);
    }
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
    writeLocalNotebook(subId, payload);
    setSaving(true);
    try {
      await updateTopic(subId, { notebook: payload });
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
  const parentTitle = sub.parentTopic?.title || "Topic";

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
        {" · "}
        <Link
          to={`/learning/${slug}/${section}/${topicId}`}
          className="hover:underline"
        >
          {parentTitle}
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold break-words sm:text-3xl">{sub.title}</h2>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
              difficultyMeta(sub.difficulty).className
            }`}
          >
            {difficultyMeta(sub.difficulty).label}
          </span>
          {sub.inReview ? (
            <span className="rounded-full border border-teal/30 bg-teal/12 px-2.5 py-0.5 text-[11px] text-teal">
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

      {nested.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted">From this note:</span>
          {nested.map((item) => (
            <span
              key={item._id}
              className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold"
            >
              {item.title}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-[#222838]/80 px-3 py-2">
        <span className="text-xs text-muted">Size</span>
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            title="Select text, then click a size"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFontSize(size)}
            className="rounded-lg border border-line px-2 py-1 text-[11px] text-muted hover:bg-white/5"
          >
            {size}
          </button>
        ))}
        <span className="ml-2 text-xs text-muted">Highlight</span>
        {HIGHLIGHTS.map((item) => (
          <button
            key={item.id}
            type="button"
            title={`Highlight ${item.id}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight(item.color)}
            className="h-6 w-6 rounded-full border border-white/20"
            style={{ background: item.color }}
          />
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => document.execCommand("removeFormat")}
          className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5"
        >
          Clear mark
        </button>
        <button
          type="button"
          title="Bullet list"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyList("ul")}
          className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:bg-white/5"
        >
          • List
        </button>
        <button
          type="button"
          title="Numbered list"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyList("ol")}
          className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:bg-white/5"
        >
          1. List
        </button>
        <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
        <span className="text-xs text-muted">Paper</span>
        {NB_THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changePaperTheme(item.id)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] ${
              paperTheme === item.id
                ? "border-teal/40 bg-teal/15 text-teal"
                : "border-line text-muted hover:bg-white/5"
            }`}
          >
            {item.label}
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
        <span className="text-xs text-muted">Difficulty</span>
        {DIFFICULTIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => patchMeta({ difficulty: item.id })}
            className={`rounded-lg border px-2 py-1 text-[11px] ${
              (sub.difficulty || "medium") === item.id
                ? item.className
                : "border-line text-muted hover:bg-white/5"
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          title="Select text in the notebook, then add it as a nested subtopic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addSelectionAsSubtopic}
          className="rounded-lg border border-gold/40 bg-gold/12 px-2.5 py-1 text-[11px] font-medium text-gold"
        >
          Add to subtopic
        </button>
        <button
          type="button"
          onClick={() => patchMeta({ inReview: !sub.inReview })}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
            sub.inReview
              ? "border-teal/40 bg-teal/15 text-teal"
              : "border-line text-muted hover:bg-white/5"
          }`}
        >
          {sub.inReview ? "In review" : "Add to review"}
        </button>
        <button
          type="button"
          onClick={() =>
            setNotebook((prev) => ({
              ...prev,
              blocks: [...prev.blocks, newBlock("text")],
            }))
          }
          className="ml-auto rounded-lg border border-line px-3 py-1 text-xs"
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
          className="rounded-lg border border-teal/40 bg-teal/10 px-3 py-1 text-xs text-teal"
        >
          Add code
        </button>
      </div>

      <div
        ref={paperRef}
        data-nb-theme={paperTheme}
        className="notebook-paper mt-5 min-h-[70vh] overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
        style={{ fontSize: "18px" }}
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
                <div className="mb-2 flex items-center gap-2" style={{ lineHeight: "32px" }}>
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
    </div>
  );
}
