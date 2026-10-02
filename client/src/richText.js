const ALLOWED_TAGS = new Set([
  "B",
  "BR",
  "DIV",
  "EM",
  "I",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

const BLOCKED_TAGS = new Set(["IFRAME", "OBJECT", "SCRIPT", "STYLE"]);

export function plainTextToHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value || "");
  return div.innerHTML.replace(/\r?\n/g, "<br>");
}

export function sanitizeRichHtml(value) {
  const root = document.createElement("div");
  root.innerHTML = String(value || "");

  [...root.querySelectorAll("*")].reverse().forEach((element) => {
    if (BLOCKED_TAGS.has(element.tagName)) {
      element.remove();
      return;
    }
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const color = element.style.color;
    const backgroundColor = element.style.backgroundColor;
    const fontStyle = element.style.fontStyle;
    const fontWeight = element.style.fontWeight;
    const textDecoration = element.style.textDecoration;
    element.removeAttribute("class");
    element.removeAttribute("id");
    [...element.attributes].forEach((attribute) => {
      if (attribute.name !== "style") element.removeAttribute(attribute.name);
    });
    element.removeAttribute("style");
    if (color) element.style.color = color;
    if (backgroundColor) element.style.backgroundColor = backgroundColor;
    if (["italic", "normal"].includes(fontStyle)) {
      element.style.fontStyle = fontStyle;
    }
    if (["bold", "normal", "700"].includes(fontWeight)) {
      element.style.fontWeight = fontWeight;
    }
    if (["underline", "none"].includes(textDecoration)) {
      element.style.textDecoration = textDecoration;
    }
  });

  return root.innerHTML;
}

export function richHtmlToPlainText(value) {
  const root = document.createElement("div");
  root.innerHTML = sanitizeRichHtml(value);
  root.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  root.querySelectorAll("div, p, li").forEach((block) => block.append("\n"));
  return (root.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
