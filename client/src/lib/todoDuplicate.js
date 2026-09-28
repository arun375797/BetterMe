export function nextTodoData(todo) {
  const text = String(todo.text || "").replace(
    /\b(block\s+)(\d+)\b/i,
    (_, label, number) => `${label}${Number(number) + 1}`
  );
  let dueDate = todo.dueDate || null;
  let endDate = todo.endDate || null;

  if (todo.dueDate && todo.endDate) {
    const start = new Date(todo.dueDate);
    const end = new Date(todo.endDate);
    const duration = end.getTime() - start.getTime();
    if (duration > 0) {
      dueDate = end.toISOString();
      endDate = new Date(end.getTime() + duration).toISOString();
    }
  }

  return {
    text,
    priority: todo.priority || "medium",
    categoryId: todo.categoryId || null,
    dueDate,
    endDate,
  };
}
