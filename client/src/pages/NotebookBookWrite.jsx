import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  createBookPage,
  deleteBookPage,
  getBookPage,
  updateBookPage,
} from "../api.js";
import { ConfirmDialog } from "../components/Dialog.jsx";

export default function NotebookBookWrite() {
  const { bookId, pageId } = useParams();
  const navigate = useNavigate();
  const { refreshBooks } = useOutletContext();
  const [book, setBook] = useState(null);
  const [heading, setHeading] = useState("");
  const [loadedHtml, setLoadedHtml] = useState("");
  const [ready, setReady] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [prevPageId, setPrevPageId] = useState(null);
  const [nextPageId, setNextPageId] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef(null);
  const headingRef = useRef(heading);

  useEffect(() => {
    headingRef.current = heading;
  }, [heading]);

  useEffect(() => {
    setReady(false);
    getBookPage(bookId, pageId)
      .then((data) => {
        setBook(data.book);
        setHeading(data.page.heading || `Page ${data.pageNumber}`);
        setLoadedHtml(data.page.html || "");
        setPageNumber(data.pageNumber);
        setPageCount(data.pageCount);
        setPrevPageId(data.prevPageId);
        setNextPageId(data.nextPageId);
        setReady(true);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [bookId, pageId]);

  useEffect(() => {
    if (ready && bodyRef.current) {
      bodyRef.current.innerHTML = loadedHtml;
    }
  }, [ready, pageId, loadedHtml]);

  function applyFormat(command, value) {
    document.execCommand(command, false, value);
    bodyRef.current?.focus();
  }

  async function save() {
    setSaving(true);
    try {
      await updateBookPage(bookId, pageId, {
        heading: headingRef.current.trim() || `Page ${pageNumber}`,
        html: bodyRef.current?.innerHTML || "",
      });
      setStatus("Saved");
      setTimeout(() => setStatus(""), 1400);
    } catch (err) {
      setStatus(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    await save();
    if (nextPageId) {
      navigate(`/notebooks/${bookId}/pages/${nextPageId}`);
      return;
    }
    const created = await createBookPage(bookId, {
      heading: `Page ${pageCount + 1}`,
    });
    await refreshBooks();
    navigate(`/notebooks/${bookId}/pages/${created._id}`);
  }

  async function goPrev() {
    if (!prevPageId) return;
    await save();
    navigate(`/notebooks/${bookId}/pages/${prevPageId}`);
  }

  if (error) {
    return <p className="p-8 text-coral">{error}</p>;
  }
  if (!book) {
    return <p className="p-8 text-muted">Opening page…</p>;
  }

  return (
    <div className="e-notebook-shell flex flex-col items-center px-4 py-6">
      <div className="mb-4 flex w-full max-w-[760px] flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex gap-3">
          <Link to="/notebooks" className="text-muted hover:text-ink">
            Notebooks
          </Link>
          <Link to={`/notebooks/${bookId}`} className="text-gold hover:underline">
            Index
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {status ? <span className="text-xs text-teal">{status}</span> : null}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-coral/40 px-3 py-1.5 text-coral"
          >
            Delete page
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-[#1b2030] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <article className="e-page-sheet px-8 py-10 sm:px-14">
        <p className="text-[11px] tracking-[0.2em] text-[#8d8168] uppercase">
          {book.title} · page {pageNumber}
        </p>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="e-page-heading mt-3"
          placeholder="Page heading"
        />
        <div className="e-toolbar mt-5">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat("bold")}>
            Bold
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("formatBlock", "h2")}
          >
            Heading
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("insertUnorderedList")}
          >
            List
          </button>
        </div>
        <div
          ref={bodyRef}
          className="e-page-body"
          contentEditable
          suppressContentEditableWarning
          onBlur={save}
        />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#d2c6ae] pt-5 text-sm">
          <button
            type="button"
            onClick={goPrev}
            disabled={!prevPageId}
            className="rounded-lg border border-[#d2c6ae] px-3 py-1.5 disabled:opacity-40"
          >
            Previous page
          </button>
          <span className="text-[#6f6758]">
            {pageNumber} / {pageCount}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-[#1d211c] px-3 py-1.5 text-[#f4efe4]"
          >
            {nextPageId ? "Next page" : "Add next page"}
          </button>
        </div>
      </article>

      {confirmDelete ? (
        <ConfirmDialog
          kicker="Delete"
          title="Delete this page?"
          message="The page content will be removed from this notebook."
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteBookPage(bookId, pageId);
            await refreshBooks();
            navigate(`/notebooks/${bookId}`);
          }}
        />
      ) : null}
    </div>
  );
}
