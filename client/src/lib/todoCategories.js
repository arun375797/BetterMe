export function categoryParentId(category) {
  const parent = category?.parent;
  if (!parent) return "";
  return String(typeof parent === "object" ? parent._id : parent);
}

export function orderedTodoCategories(categories = []) {
  const ids = new Set(categories.map((category) => String(category._id)));
  const roots = categories.filter((category) => {
    const parentId = categoryParentId(category);
    return !parentId || !ids.has(parentId);
  });
  const childrenByParent = new Map();
  for (const category of categories) {
    const parentId = categoryParentId(category);
    if (!parentId || !ids.has(parentId)) continue;
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(category);
  }

  const ordered = [];
  for (const root of roots) {
    ordered.push({ ...root, depth: 0 });
    for (const child of childrenByParent.get(String(root._id)) || []) {
      ordered.push({ ...child, depth: 1, parentCategory: root });
    }
  }
  return ordered;
}

export function categoryAndChildIds(categories, categoryId) {
  const ids = new Set([String(categoryId)]);
  for (const category of categories || []) {
    if (categoryParentId(category) === String(categoryId)) {
      ids.add(String(category._id));
    }
  }
  return ids;
}
