import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import PersonalityFormModal from "../components/PersonalityFormModal.jsx";
import { PERSONALITY_SECTIONS } from "../personality.js";
import {
  createPersonalityItem,
  getPersonalityItems,
} from "../api.js";

const meta = PERSONALITY_SECTIONS.books;

export default function PersonalityBooksPage() {
  const { refreshPersonality } = useOutletContext();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const data = await getPersonalityItems("books");
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const want = useMemo(
    () => items.filter((item) => item.status !== "read"),
    [items]
  );
  const read = useMemo(
    () => items.filter((item) => item.status === "read"),
    [items]
  );

  return (
    <div className="page-pad">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-violet uppercase">
            My Personality · {meta.label}
          </p>
          <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">{meta.title}</h2>
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

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <BookColumn
          heading="Want to read"
          empty="No books on the list yet."
          items={want}
        />
        <BookColumn
          heading="Have read"
          empty="Nothing marked as read yet."
          items={read}
        />
      </div>

      {showForm ? (
        <PersonalityFormModal
          section="books"
          onClose={() => setShowForm(false)}
          onSubmit={async (payload) => {
            const created = await createPersonalityItem(payload);
            await load();
            refreshPersonality?.();
            navigate(`/personality/books/${created._id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function BookColumn({ heading, empty, items }) {
  return (
    <section>
      <h3 className="text-lg font-semibold">{heading}</h3>
      {items.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item._id}>
              <Link
                to={`/personality/books/${item._id}`}
                className="block rounded-2xl border border-line bg-[#222838]/80 px-4 py-3 transition hover:border-white/15"
              >
                <span className="block font-medium">{item.title}</span>
                {item.subtitle ? (
                  <span className="mt-1 block text-sm text-muted">
                    {item.subtitle}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
