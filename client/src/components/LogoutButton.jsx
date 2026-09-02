import { authLost } from "../authSession.js";
import { logout as logoutRequest } from "../api.js";

export default function LogoutButton({
  className = "",
  compact = false,
  onClick,
}) {
  async function logout() {
    onClick?.();
    try {
      await logoutRequest();
    } finally {
      authLost();
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={logout}
        aria-label="Log out"
        title="Log out"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/5 text-muted hover:border-coral/40 hover:bg-coral/10 hover:text-coral ${className}`}
      >
        <LogoutIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-coral/12 hover:text-coral ${className}`}
    >
      <LogoutIcon className="h-4 w-4 shrink-0" />
      Log out
    </button>
  );
}

function LogoutIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 10h7m0 0-2.5-2.5M16 10l-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
