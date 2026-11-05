import { Link } from "react-router-dom";

export function curriculumSummary(curriculum = []) {
  const total = curriculum.reduce((sum, track) => ({
    topics: sum.topics + track.mainTopics,
    subtopics: sum.subtopics + track.subtopics,
    questions: sum.questions + track.questions,
  }), { topics: 0, subtopics: 0, questions: 0 });
  return `${total.topics} topics · ${total.subtopics} subtopics · ${total.questions} questions`;
}

export default function SubjectCurriculum({ slug, curriculum = [] }) {
  return (
    <div className="space-y-4">
      {curriculum.map((track) => (
        <section key={track.section}>
          <Link to={`/learning/${slug}/${track.section}`} className="text-sm font-semibold capitalize text-teal hover:underline">
            {track.section} <span className="text-xs font-normal text-muted">({track.mainTopics} topics, {track.subtopics} subtopics)</span>
          </Link>
          {track.topics.length ? (
            <ul className="mt-2 space-y-2">
              {track.topics.map((topic) => <TopicNode key={topic._id} slug={slug} section={track.section} topic={topic} />)}
            </ul>
          ) : <p className="mt-2 text-xs text-muted">No {track.section} topics yet.</p>}
        </section>
      ))}
    </div>
  );
}

function TopicNode({ slug, section, topic }) {
  const link = (
    <Link to={`/learning/${slug}/${section}/${topic._id}`} className="min-w-0 flex-1 break-words text-sm hover:text-teal hover:underline">
      {topic.title}
    </Link>
  );
  const count = <span className="shrink-0 text-[11px] text-muted">{topic.totalQuestions} questions</span>;
  return (
    <li className="rounded-lg border border-line/60 px-3 py-2">
      <div className="flex items-start justify-between gap-3">{link}{count}</div>
      {topic.children.length ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted">
            {topic.children.length} subtopics
          </summary>
          <ul className="mt-3 space-y-2 border-l border-line pl-3">
            {topic.children.map((child) => <TopicNode key={child._id} slug={slug} section={section} topic={child} />)}
          </ul>
        </details>
      ) : null}
    </li>
  );
}
