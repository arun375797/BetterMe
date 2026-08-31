import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { deleteBook, getBookIndex, updateBook } from "../api.js";
import BookFormModal from "../components/BookFormModal.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";

export default function NotebookBookIndex() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { refreshBooks } = useOutletContext();
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getBookIndex(bookId)
      .then((data) => {
        setBook(data.book);
        setPages(data.pages || []);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [bookId]);

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }
  if (!book) {
    return <p className="p-8 text-muted">Opening index…</p>;
  }

  const firstPageId = pages[0]?._id;

  return (
    <div className="e-notebook-shell flex flex-col items-center px-4 py-6">
      <div className="mb-4 flex w-full max-w-[760px] items-center justify-between gap-3 text-sm">
        <Link to="/notebooks" className="text-muted hover:text-ink">
          All notebooks
        </Link>
        <div className="flex gap-2">
          {firstPageId ? (
            <Link
              to={`/notebooks/${bookId}/pages/${firstPageId}`}
              className="rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink"
            >
              Open page 1
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-coral/40 px-3 py-1.5 text-coral"
          >
            Delete
          </button>
        </div>
      </div>

      <article className="e-index-sheet px-10 py-12 sm:px-14">
        <p className="e-index-title text-center text-[11px] text-[#8d8168]">
          Index
        </p>
        <h1 className="mt-3 text-center font-serif text-3xl">{book.title}</h1>
        {book.description ? (
          <p className="mt-2 text-center text-sm text-[#6f6758]">
            {book.description}
          </p>
        ) : null}
        <div className="mx-auto mt-5 h-px w-24 bg-[#d2c6ae]" />

        <ol className="mt-10 space-y-5">
          {pages.map((page, index) => (
            <li key={page._id}>
              {(page.headings || [{ text: page.heading, level: 1 }]).map(
                (item, headingIndex) => (
                  <Link
                    key={`${page._id}-${headingIndex}`}
                    to={`/notebooks/${bookId}/pages/${page._id}`}
                    className="e-index-row py-1 hover:text-[#6a4f12]"
                    style={{
                      paddingLeft: item.level > 1 ? (item.level - 1) * 18 : 0,
                    }}
                  >
                    <span className="font-serif">
                      {headingIndex === 0 ? page.heading : item.text}
                    </span>
                    <span className="e-index-dots" aria-hidden="true" />
                    <span className="font-serif text-sm text-[#6f6758]">
                      {index + 1}
                    </span>
                  </Link>
                )
              )}
            </li>
          ))}
        </ol>
      </article>

      {showEdit ? (
        <BookFormModal
          book={book}
          onClose={() => setShowEdit(false)}
          onSubmit={async (data) => {
            const updated = await updateBook(bookId, data);
            setBook(updated);
            await refreshBooks();
          }}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          kicker="Delete"
          title={`Delete “${book.title}”?`}
          message="This notebook and all of its pages will be removed."
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteBook(bookId);
            await refreshBooks();
            navigate("/notebooks");
          }}
        />
      ) : null}
    </div>
  );
}
