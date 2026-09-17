import { useRef } from "react";
import { highlightCode } from "../notebook.js";

export default function IdeEditor({
  value,
  onChange,
  placeholder,
  compact,
  language = "javascript",
  readOnly = false,
}) {
  const highlightRef = useRef(null);
  const inputRef = useRef(null);
  const gutterRef = useRef(null);
  const lines = Math.max(1, (value || "").split("\n").length);
  const fitHeight = readOnly
    ? Math.min(Math.max(22 * lines + 28, 160), 640)
    : undefined;

  function syncScroll(source) {
    const highlight = highlightRef.current;
    const input = inputRef.current;
    const gutter = gutterRef.current;
    const top = source?.scrollTop ?? input?.scrollTop ?? highlight?.scrollTop ?? 0;
    const left = source?.scrollLeft ?? input?.scrollLeft ?? highlight?.scrollLeft ?? 0;
    if (highlight && source !== highlight) {
      highlight.scrollTop = top;
      highlight.scrollLeft = left;
    }
    if (input && source !== input) {
      input.scrollTop = top;
      input.scrollLeft = left;
    }
    if (gutter) gutter.scrollTop = top;
  }

  return (
    <div className={`jf-editor${compact ? " ide-compact" : ""}`}>
      <div className="jf-titlebar" aria-hidden>
        <span className="jf-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="jf-filename">{language || "code"}</span>
        <span className="jf-theme-label">JellyFish</span>
      </div>
      <div
        className="ide-shell"
        style={fitHeight ? { minHeight: fitHeight, height: fitHeight } : undefined}
      >
        <div ref={gutterRef} className="ide-gutter" aria-hidden>
          {Array.from({ length: lines }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <div className="ide-stage">
          <div className="jf-beam" aria-hidden />
          <pre
            ref={highlightRef}
            className="ide-highlight"
            onScroll={readOnly ? (e) => syncScroll(e.currentTarget) : undefined}
            dangerouslySetInnerHTML={{
              __html: highlightCode(value, language) || " ",
            }}
          />
          {readOnly ? null : (
            <textarea
              ref={inputRef}
              spellCheck={false}
              wrap="off"
              value={value}
              placeholder={placeholder}
              className="ide-input"
              onScroll={(e) => syncScroll(e.currentTarget)}
              onChange={(e) => onChange?.(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
