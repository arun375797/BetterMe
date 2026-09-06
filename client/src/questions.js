export function solutionsOf(item) {
  if (Array.isArray(item?.solutions) && item.solutions.length) {
    return item.solutions;
  }
  if (item?.code || item?.notes) {
    return [
      {
        id: "legacy",
        language: item.language || "javascript",
        code: item.code || "",
        logic: item.notes || "",
      },
    ];
  }
  return [];
}

export function questionHasAnswer(item) {
  if (typeof item?.hasAnswer === "boolean") return item.hasAnswer;
  if (
    solutionsOf(item).some(
      (way) =>
        Boolean(String(way.code || "").trim()) ||
        Boolean(String(way.logic || "").trim())
    )
  ) {
    return true;
  }
  return Boolean(
    String(item?.code || "").trim() || String(item?.notes || "").trim()
  );
}
