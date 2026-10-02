import { useEffect, useRef, useState } from "react";
import {
  plainTextToHtml,
  richHtmlToPlainText,
  sanitizeRichHtml,
} from "../richText.js";

const TEXT_COLORS = ["#eeffff", "#00f7ff", "#ffd900", "#ff8b78", "#c4a7ff"];
const HIGHLIGHTS = ["#5c4700", "#075b56", "#6b2330", "#4b2b75"];

function ToolButton({ title, children, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 px-2 text-xs text-[#d7dbe6] hover:border-gold/40 hover:bg-white/10"
    >
      {children}
    </button>
  );
}

export default function InlineApproachEditor({
  text,
  html,
  open,
  onToggle,
  onSave,
  title = "How to approach it",
  emptyMessage = "No approach added yet. Select Edit to write one here.",
  collapsible = true,
  variant = "approach",
}) {
  const editorRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const displayHtml = sanitizeRichHtml(html || plainTextToHtml(text));

  useEffect(() => {
    if (editing && editorRef.current) {
      editorRef.current.innerHTML = displayHtml;
      editorRef.current.focus();
    }
  }, [editing]);

  function format(command, value = null) {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
  }

  async function save() {
    const nextHtml = sanitizeRichHtml(editorRef.current?.innerHTML || "");
    const nextText = richHtmlToPlainText(nextHtml);
    setSaving(true);
    setMessage("");
    try {
      await onSave({ text: nextText, html: nextHtml });
      setEditing(false);
      setMessage("Saved");
      setTimeout(() => setMessage(""), 1400);
    } catch (error) {
      setMessage(error.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    setMessage("");
  }

  return (
    <div
      className={
        variant === "solution"
          ? "mt-3 overflow-hidden rounded-xl border border-white/10 bg-surface/60"
          : "mt-6 max-w-3xl rounded-2xl border border-gold/20 bg-gold/5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={editing}
            className="text-left text-[11px] tracking-[0.14em] text-gold uppercase disabled:cursor-default"
          >
            {title}
          </button>
        ) : (
          <span className="text-left text-[11px] tracking-[0.14em] text-muted uppercase">
            {title}
          </span>
        )}
        <div className="flex items-center gap-2">
          {message ? (
            <span className={`text-xs ${message === "Saved" ? "text-teal" : "text-coral"}`}>
              {message}
            </span>
          ) : null}
          {!editing ? (
            <button
              type="button"
              onClick={() => {
                if (!open) onToggle?.();
                setEditing(true);
              }}
              className="rounded-lg border border-cyan/30 px-3 py-1.5 text-xs text-cyan hover:bg-cyan/10"
            >
              Edit
            </button>
          ) : null}
          {collapsible ? (
            <button
              type="button"
              onClick={onToggle}
              disabled={editing}
              className="text-xs text-muted disabled:opacity-40"
            >
              {open ? "Hide" : "Show"}
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="border-t border-gold/15">
          {editing ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5 border-b border-gold/15 px-4 py-3">
                <ToolButton title="Bold" onClick={() => format("bold")}>
                  <strong>B</strong>
                </ToolButton>
                <ToolButton title="Italic" onClick={() => format("italic")}>
                  <em>I</em>
                </ToolButton>
                <ToolButton title="Underline" onClick={() => format("underline")}>
                  <span className="underline">U</span>
                </ToolButton>
                <ToolButton title="Bulleted list" onClick={() => format("insertUnorderedList")}>
                  • List
                </ToolButton>
                <ToolButton title="Numbered list" onClick={() => format("insertOrderedList")}>
                  1. List
                </ToolButton>
                <span className="ml-1 text-[10px] tracking-wide text-muted uppercase">Text</span>
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={`Text color ${color}`}
                    aria-label={`Text color ${color}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => format("foreColor", color)}
                    className="h-6 w-6 rounded-full border border-white/25"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <span className="ml-1 text-[10px] tracking-wide text-muted uppercase">Highlight</span>
                {HIGHLIGHTS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={`Highlight ${color}`}
                    aria-label={`Highlight ${color}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => format("hiliteColor", color)}
                    className="h-6 w-6 rounded-md border border-white/25"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <ToolButton title="Remove formatting" onClick={() => format("removeFormat")}>
                  Clear
                </ToolButton>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="approach-rich min-h-56 px-4 py-4 text-sm leading-6 text-[#d7dbe6] outline-none"
              />
              <div className="flex justify-end gap-2 border-t border-gold/15 px-4 py-3">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-white/6"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-gold px-4 py-1.5 text-xs font-semibold text-[#221b00] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </>
          ) : displayHtml ? (
            <div
              className="approach-rich px-4 py-4 text-sm leading-6 text-[#d7dbe6]"
              dangerouslySetInnerHTML={{ __html: displayHtml }}
            />
          ) : (
            <p className="px-4 py-5 text-sm text-muted">
              {emptyMessage}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
