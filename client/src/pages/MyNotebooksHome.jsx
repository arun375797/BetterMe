import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { createBook } from "../api.js";
import BookFormModal from "../components/BookFormModal.jsx";

export default function MyNotebooksHome() {
  const { books = [], refreshBooks } = useOutletContext();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="e-notebook-shell page-pad">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.22em] text-gold uppercase">
            E-notebooks
          </p>
          <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">My Notebooks</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Each notebook is its own book. Open one to read the index, then jump
            to a page by its heading.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#1b2030]"
        >
          New notebook
        </button>
      </div>

      {books.length === 0 ? (
        <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <p className="text-sm text-muted">No notebooks yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-gold hover:underline"
          >
            Create a notebook
          </button>
        </div>
      ) : (
        <div className="mx-auto mt-10 grid w-full max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Link
              key={book._id}
              to={`/notebooks/${book._id}`}
              className="e-cover p-5"
            >
              <div className="flex flex-1 flex-col justify-between pl-3">
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-gold uppercase">
                    Notebook
                  </p>
                  <h3 className="mt-3 font-serif text-2xl leading-snug">
                    {book.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {book.description || "Open the index"}
                  </p>
                </div>
                <p className="mt-6 text-[11px] tracking-wide text-muted uppercase">
                  {book.pageCount || 0}{" "}
                  {book.pageCount === 1 ? "page" : "pages"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm ? (
        <BookFormModal
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            const created = await createBook(data);
            await refreshBooks();
            if (created.firstPageId) {
              navigate(`/notebooks/${created._id}/pages/${created.firstPageId}`);
            } else {
              navigate(`/notebooks/${created._id}`);
            }
          }}
        />
      ) : null}
    </div>
  );
}
