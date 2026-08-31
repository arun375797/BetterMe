import { useEffect, useState } from "react";

const SIZE = {
  confirm: "w-full max-w-[400px]",
  form: "w-full max-w-lg max-h-[90dvh] overflow-y-auto",
  wide: "flex h-[min(92dvh,880px)] w-full max-w-6xl flex-col",
};

export function Dialog({ size = "form", onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b0f18]/78 px-3 py-3 backdrop-blur-[7px] sm:items-center sm:px-4 sm:py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`${SIZE[size] || SIZE.form} overflow-hidden rounded-t-2xl border border-white/10 bg-[#1e2434] shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/5 sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ kicker, title, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-6">
      <div>
        {kicker ? (
          <p className="text-[11px] tracking-[0.18em] text-muted uppercase">
            {kicker}
          </p>
        ) : null}
        <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2.5 py-1 text-sm text-muted hover:bg-white/6 hover:text-ink"
        >
          Close
        </button>
      ) : null}
    </div>
  );
}

export function DialogFooter({ children }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-white/8 bg-[#171c2a]/40 px-4 py-4 sm:px-6">
      {children}
    </div>
  );
}

export function ConfirmDialog({
  kicker = "Confirm",
  title,
  message,
  confirmLabel = "Delete",
  danger = true,
  onClose,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog size="confirm" onClose={busy ? undefined : onClose}>
      <div className="px-6 pt-6">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            danger ? "bg-coral/12 text-coral" : "bg-teal/12 text-teal"
          }`}
        >
          {danger ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7m-8 0 .7 12.2A1.5 1.5 0 0 0 8.7 20.5h6.6a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
            </svg>
          ) : (
            <span className="text-lg">?</span>
          )}
        </div>
        <p className="mt-4 text-[11px] tracking-[0.18em] text-muted uppercase">
          {kicker}
        </p>
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
      </div>
      <DialogFooter>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/6"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={go}
          className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
            danger
              ? "bg-coral text-[#2a1410]"
              : "bg-teal text-[#10201e]"
          }`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </DialogFooter>
    </Dialog>
  );
}
