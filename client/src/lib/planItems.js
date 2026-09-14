export const PLAN_PRIORITY_META = {
  high: { label: "High", className: "text-coral bg-coral/12", bar: "bg-coral" },
  medium: { label: "Medium", className: "text-gold bg-gold/12", bar: "bg-gold" },
  low: { label: "Low", className: "text-teal bg-teal/12", bar: "bg-teal" },
};

const RANK = { high: 0, medium: 1, low: 2 };

export function sortPlanItems(a, b) {
  const aDone = topicLearned(a);
  const bDone = topicLearned(b);
  if (aDone !== bDone) return aDone ? 1 : -1;
  const dateCmp = String(a.date || "").localeCompare(String(b.date || ""));
  if (dateCmp) return dateCmp;
  const p = (RANK[a.priority] ?? 1) - (RANK[b.priority] ?? 1);
  if (p) return p;
  return (a.order || 0) - (b.order || 0);
}

export function subjectIdOf(item) {
  return String(item?.subject?._id || item?.subject || "");
}

export function groupPlanByLanguage(items, subjects) {
  const nested = nestPlanItems(items);
  const bySubject = new Map();
  for (const item of nested) {
    const sid = subjectIdOf(item);
    if (!bySubject.has(sid)) bySubject.set(sid, []);
    bySubject.get(sid).push(item);
  }
  const groups = (subjects || [])
    .map((subject) => {
      const topics = (bySubject.get(String(subject._id)) || [])
        .slice()
        .sort(sortPlanItems);
      const open = topics.filter((item) => !topicLearned(item));
      const nextDate = open[0]?.date || "";
      return {
        subject,
        topics,
        openCount: open.length,
        nextDate,
        finished: topics.length > 0 && open.length === 0,
      };
    })
    .sort((a, b) => {
      const rank = (group) =>
        group.finished ? 2 : group.topics.length ? 0 : 1;
      const rankCmp = rank(a) - rank(b);
      if (rankCmp) return rankCmp;
      const dateCmp = String(a.nextDate).localeCompare(String(b.nextDate));
      if (dateCmp) return dateCmp;
      return (a.subject.order || 0) - (b.subject.order || 0);
    });
  return groups;
}

export function nestPlanItems(items) {
  const list = (items || []).slice().sort(sortPlanItems);
  const byParent = new Map();
  for (const item of list) {
    const key = item.parent ? String(item.parent) : "";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }
  function withChildren(item) {
    const children = (byParent.get(String(item._id)) || [])
      .map(withChildren)
      .sort(sortPlanItems);
    return { ...item, children };
  }
  return (byParent.get("") || []).map(withChildren).sort(sortPlanItems);
}

export function topicLearned(item) {
  if (item.children?.length) return item.children.every(topicLearned);
  return Boolean(item.learned);
}

export function formatPlanDate(value) {
  const key = String(value || "").slice(0, 10);
  const [y, m, d] = key.split("-").map(Number);
  if (!y) return key;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
