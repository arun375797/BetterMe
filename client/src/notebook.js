const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "class",
  "new",
  "this",
  "import",
  "from",
  "export",
  "default",
  "async",
  "await",
  "try",
  "catch",
  "throw",
  "true",
  "false",
  "null",
  "undefined",
  "typeof",
  "in",
  "of",
  "switch",
  "case",
  "break",
  "continue",
  "def",
  "print",
  "and",
  "or",
  "not",
]);

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function highlightCode(code) {
  const escaped = escapeHtml(code || "");
  return escaped.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*(?=\s*\())|(\b[A-Za-z_]\w*\b)/g,
    (match, comment, string, number, fn, word) => {
      if (comment) return `<span class="code-tok-cmt">${match}</span>`;
      if (string) return `<span class="code-tok-str">${match}</span>`;
      if (number) return `<span class="code-tok-num">${match}</span>`;
      if (fn) return `<span class="code-tok-fn">${match}</span>`;
      if (word && KEYWORDS.has(word)) {
        return `<span class="code-tok-key">${match}</span>`;
      }
      return match;
    }
  );
}

export function newBlock(type = "text") {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
                html: type === "text" ? "<div><br></div>" : "",
    code: "",
    language: "javascript",
  };
}

export function emptyNotebook() {
  return { fontSize: 18, blocks: [newBlock("text")] };
}

export function storageKey(subId) {
  return `notebook:${subId}`;
}

export function notebookHasContent(notebook) {
  if (!notebook?.blocks?.length) return false;
  return notebook.blocks.some((block) => {
    if (block.type === "code") return Boolean((block.code || "").trim());
    const html = String(block.html || "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/&nbsp;/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    return html.length > 0;
  });
}

export function normalizeNotebook(raw) {
  if (!raw || !Array.isArray(raw.blocks) || raw.blocks.length === 0) {
    return emptyNotebook();
  }
  return {
    fontSize: Number(raw.fontSize) || 18,
    blocks: raw.blocks.map((block) => ({
      id: String(block.id || block._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      type: block.type === "code" ? "code" : "text",
      html: block.html || "<div><br></div>",
      code: block.code || "",
      language: block.language || "javascript",
    })),
  };
}

export function readLocalNotebook(subId) {
  try {
    const raw = localStorage.getItem(storageKey(subId));
    if (!raw) return null;
    return normalizeNotebook(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLocalNotebook(subId, notebook) {
  try {
    localStorage.setItem(storageKey(subId), JSON.stringify(notebook));
  } catch {
    /* ignore quota errors */
  }
}

export function clearLocalNotebook(subId) {
  try {
    localStorage.removeItem(storageKey(subId));
  } catch {
    /* ignore */
  }
}

export function notebookPlainText(notebook) {
  if (!notebook?.blocks?.length) return "";
  return notebook.blocks
    .map((block) => {
      if (block.type === "code") return String(block.code || "").trim();
      return String(block.html || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(Boolean)
    .join("\n");
}
