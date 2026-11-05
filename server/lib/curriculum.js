export function subjectCurriculum(subjectId, topics, questionCounts) {
  const counts = new Map(questionCounts.map((row) => [String(row._id), row.n]));
  return ["theory", "practical"].map((section) => {
    const list = topics.filter((topic) => String(topic.subject) === String(subjectId) &&
      (topic.section || "theory") === section && !topic.fromNote);
    const nodes = new Map(list.map((topic) => [String(topic._id), {
      _id: topic._id, title: topic.title, section, parent: topic.parent,
      slNo: topic.slNo, order: topic.order, questionCount: counts.get(String(topic._id)) || 0,
      children: [],
    }]));
    const roots = [];
    for (const node of nodes.values()) {
      const parent = nodes.get(String(node.parent));
      if (parent && parent !== node) parent.children.push(node);
      else roots.push(node);
    }
    function sortAndCount(rows, visited = new Set()) {
      rows.sort((a, b) => (a.slNo || 0) - (b.slNo || 0) || (a.order || 0) - (b.order || 0));
      for (const row of rows) {
        if (visited.has(String(row._id))) continue;
        visited.add(String(row._id));
        sortAndCount(row.children, visited);
        row.totalQuestions = row.questionCount + row.children.reduce((sum, child) => sum + (child.totalQuestions || 0), 0);
      }
    }
    sortAndCount(roots);
    return {
      section, topics: roots, mainTopics: roots.length, subtopics: list.length - roots.length,
      questions: list.reduce((sum, topic) => sum + (counts.get(String(topic._id)) || 0), 0),
    };
  });
}
