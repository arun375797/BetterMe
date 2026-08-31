import { useRef } from "react";
import { highlightCode } from "../notebook.js";

export default function IdeEditor({ value, onChange, placeholder, compact }) {
  const highlightRef = useRef(null);
  const inputRef = useRef(null);
  const gutterRef = useRef(null);
  const lines = Math.max(1, (value || "").split("\n").length);

  function syncScroll() {
    const highlight = highlightRef.current;
    const input = inputRef.current;
    const gutter = gutterRef.current;
    if (!highlight || !input) return;
    highlight.scrollTop = input.scrollTop;
    highlight.scrollLeft = input.scrollLeft;
    if (gutter) gutter.scrollTop = input.scrollTop;
  }

  return (
    <div className={`ide-shell${compact ? " ide-compact" : ""}`}>
      <div ref={gutterRef} className="ide-gutter" aria-hidden>
        {Array.from({ length: lines }, (_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
      <div className="ide-stage">
        <pre
          ref={highlightRef}
          className="ide-highlight"
          dangerouslySetInnerHTML={{
            __html: highlightCode(value) || " ",
          }}
        />
        <textarea
          ref={inputRef}
          spellCheck={false}
          wrap="off"
          value={value}
          placeholder={placeholder}
          className="ide-input"
          onScroll={syncScroll}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
