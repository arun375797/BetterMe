const PAGE = {
  width: 210,
  height: 297,
  marginX: 12,
  top: 12,
  bottom: 12,
};

function pdfText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function safeFileName(value) {
  const cleaned = String(value || "questions")
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "questions";
}

export async function downloadQuestionPdf({ subjectName, section, groups }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const contentWidth = PAGE.width - PAGE.marginX * 2;
  let y = PAGE.top;
  let pageNumber = 1;

  function footer() {
    doc.setDrawColor(218, 222, 228);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginX, PAGE.height - 9, PAGE.width - PAGE.marginX, PAGE.height - 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(110, 116, 126);
    doc.text(`${pdfText(subjectName)} - ${section}`, PAGE.marginX, PAGE.height - 5.2);
    doc.text(String(pageNumber), PAGE.width - PAGE.marginX, PAGE.height - 5.2, {
      align: "right",
    });
  }

  function newPage() {
    footer();
    doc.addPage();
    pageNumber += 1;
    y = PAGE.top;
  }

  function ensure(height) {
    if (y + height > PAGE.height - PAGE.bottom - 5) newPage();
  }

  function heading(text, level) {
    const config =
      level === 1
        ? { size: 12, indent: 0, gapTop: 3.2, gapBottom: 1.4, color: [12, 91, 92] }
        : { size: 9.5, indent: 3, gapTop: 2.1, gapBottom: 0.8, color: [45, 50, 60] };
    const lines = doc.splitTextToSize(pdfText(text), contentWidth - config.indent);
    const height = lines.length * (config.size * 0.39) + config.gapTop + config.gapBottom;
    ensure(height + 3);
    y += config.gapTop;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(config.size);
    doc.setTextColor(...config.color);
    doc.text(lines, PAGE.marginX + config.indent, y);
    y += lines.length * (config.size * 0.39) + config.gapBottom;
  }

  function questions(items, indent = 5) {
    items.forEach((question, index) => {
      const number = `${index + 1}.`;
      const textIndent = indent + 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.4);
      const lines = doc.splitTextToSize(
        pdfText(question.title),
        contentWidth - textIndent
      );
      const lineHeight = 3.45;
      ensure(Math.max(4, lines.length * lineHeight) + 1);
      doc.setTextColor(35, 39, 47);
      doc.text(number, PAGE.marginX + indent, y);
      doc.text(lines, PAGE.marginX + textIndent, y);
      y += Math.max(4, lines.length * lineHeight) + 0.45;
    });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(18, 24, 33);
  doc.text(`${pdfText(subjectName)} - ${section === "practical" ? "Practical" : "Theory"}`, PAGE.marginX, y);
  y += 5.3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 106, 116);
  const questionTotal = groups.reduce(
    (total, group) =>
      total +
      group.questions.length +
      group.subtopics.reduce((sum, subtopic) => sum + subtopic.questions.length, 0),
    0
  );
  doc.text(`${groups.length} topics - ${questionTotal} questions`, PAGE.marginX, y);
  y += 4;
  doc.setDrawColor(12, 145, 146);
  doc.setLineWidth(0.45);
  doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
  y += 1.2;

  groups.forEach((group, topicIndex) => {
    const topicNumber = Number(group.slNo) || topicIndex + 1;
    const hasQuestions =
      group.questions.length ||
      group.subtopics.some((subtopic) => subtopic.questions.length);
    heading(
      `${topicNumber}. ${group.title}${hasQuestions ? "" : " - No questions"}`,
      1
    );
    if (group.questions.length) questions(group.questions);
    group.subtopics.forEach((subtopic) => {
      heading(subtopic.title, 2);
      questions(subtopic.questions, 8);
    });
  });

  footer();
  const fileName = `${safeFileName(subjectName)}-${section}-questions.pdf`;
  doc.save(fileName);
  return { fileName, questionTotal };
}
