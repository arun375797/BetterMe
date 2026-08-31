import { Link, useOutletContext, useParams } from "react-router-dom";
import { accentMap } from "../theme.jsx";

const tracks = [
  {
    id: "theory",
    title: "Theory",
    copy: "Main topics and the concepts under each one.",
    accent: "teal",
  },
  {
    id: "practical",
    title: "Practical",
    copy: "Topics, then subtopics, then questions — same subjects, hands-on.",
    accent: "gold",
  },
];

export default function SubjectHub() {
  const { slug } = useParams();
  const { subjects } = useOutletContext();
  const subject = subjects.find((item) => item.slug === slug);
  const accent = accentMap[subject?.accent] || accentMap.teal;

  if (!subject) {
    return <p className="p-8 text-muted">Loading…</p>;
  }

  return (
    <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[1fr_280px]">
      <section className="page-pad">
        <p className={`text-[12px] tracking-[0.18em] uppercase ${accent.text}`}>
          BetterMe · {subject.shortName}
        </p>
        <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">{subject.name}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Same tools as JavaScript on Mongo, Node, React, and DSA. Theory:
          topics, star, view more, notebooks, review, add-from-note.
          Practical: topic → subtopic → questions.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tracks.map((track) => {
            const trackAccent = accentMap[track.accent];
            const stats = subject.stats?.[track.id] || {};
            return (
              <Link
                key={track.id}
                to={`/learning/${slug}/${track.id}`}
                className={`rounded-2xl border border-line bg-[#222838]/80 p-6 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:border-white/15 ${trackAccent.glow}`}
              >
                <p className={`text-xs font-medium ${trackAccent.text}`}>
                  Section
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{track.copy}</p>
                <p className="mt-5 text-xs text-muted">
                  {stats.mainTopics || 0} topics · {stats.items || 0}{" "}
                  {track.id === "practical" ? "questions" : "subtopics"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="page-aside">
        <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
          Path
        </p>
        <h3 className="mt-2 text-lg font-semibold">Learning → {subject.shortName}</h3>
        <p className="mt-6 text-sm leading-6 text-muted">
          Theory and Practical stay separate so class notes and practice
          questions do not mix in one list.
        </p>
      </aside>
    </div>
  );
}
