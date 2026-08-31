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
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const bodyRef = useRef(null);
  const headingRef = useRef(heading);
  const savedRangeRef = useRef(null);

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

  function openLinkModal(e) {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    setLinkUrl("");
    setLinkModalOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!url) return;
    const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    bodyRef.current?.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand("createLink", false, fullUrl);
    // Set target=_blank on the newly created link(s)
    bodyRef.current?.querySelectorAll(`a[href="${fullUrl}"]`).forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    setLinkModalOpen(false);
    save();
  }

  function handleBodyClick(e) {
    const anchor = e.target.closest("a[href]");
    if (anchor) {
      e.preventDefault();
      window.open(anchor.href, "_blank", "noopener,noreferrer");
    }
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

      <article className="e-page-sheet px-5 py-8 sm:px-14 sm:py-10">
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
          <button
            type="button"
            onMouseDown={openLinkModal}
            title="Insert hyperlink"
          >
            🔗 Link
          </button>
        </div>
        <div
          ref={bodyRef}
          className="e-page-body"
          contentEditable
          suppressContentEditableWarning
          onBlur={save}
          onClick={handleBodyClick}
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

      {linkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#d2c6ae] bg-[#faf6ef] p-6 shadow-xl">
            <h3 className="mb-1 text-sm font-semibold text-[#4a4336]">Insert hyperlink</h3>
            <p className="mb-4 text-xs text-[#8d8168]">Paste a URL — the selected text will become a clickable link.</p>
            <input
              autoFocus
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") setLinkModalOpen(false);
              }}
              className="w-full rounded-lg border border-[#d2c6ae] bg-white px-3 py-2 text-sm text-[#2d2a22] outline-none focus:border-[#b5a47a] focus:ring-2 focus:ring-[#b5a47a]/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="rounded-lg border border-[#d2c6ae] px-4 py-1.5 text-sm text-[#6f6758]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyLink}
                className="rounded-lg bg-[#1d211c] px-4 py-1.5 text-sm font-semibold text-[#f4efe4]"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
