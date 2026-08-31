import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom";
import PersonalityFormModal from "../components/PersonalityFormModal.jsx";
import { PERSONALITY_SECTIONS } from "../personality.js";
import {
  createPersonalityItem,
  getPersonalityItems,
} from "../api.js";

export default function PersonalitySectionPage() {
  const { refreshPersonality } = useOutletContext();
  const { section } = useParams();
  const navigate = useNavigate();
  const meta = PERSONALITY_SECTIONS[section];
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    if (!meta) return;
    try {
      const data = await getPersonalityItems(section);
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [section]);

  if (section === "books") {
    return <Navigate to="/personality/books" replace />;
  }
  if (!meta) {
    return <Navigate to="/personality/books" replace />;
  }

  return (
    <div className="px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-violet uppercase">
            My Personality · {meta.label}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{meta.title}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">{meta.blurb}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-[#1b2030]"
        >
          {meta.addLabel}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      {items.length === 0 ? (
        <div className="mt-14 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm text-muted">No cards yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-violet hover:underline"
          >
            {meta.addLabel}
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item._id}
              to={`/personality/${section}/${item._id}`}
              className="rounded-2xl border border-line bg-[#222838]/80 p-5 transition hover:border-white/15"
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {item.subtitle ||
                  (item.details
                    ? item.details.slice(0, 120)
                    : "Open to add details")}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showForm ? (
        <PersonalityFormModal
          section={section}
          onClose={() => setShowForm(false)}
          onSubmit={async (payload) => {
            const created = await createPersonalityItem(payload);
            await load();
            refreshPersonality?.();
            navigate(`/personality/${section}/${created._id}`);
          }}
        />
      ) : null}
    </div>
  );
}
