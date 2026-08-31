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
