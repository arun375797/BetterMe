export default function Logo({ showText = true, className = "", iconClass = "h-8 w-8" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className={`shrink-0 ${iconClass}`}
        aria-hidden={showText ? undefined : true}
        role={showText ? undefined : "img"}
        aria-label={showText ? undefined : "BetterMe"}
      >
        <defs>
          <linearGradient id="bm-mark" x1="4" y1="28" x2="28" y2="4">
            <stop offset="0%" stopColor="#3ce6d4" />
            <stop offset="55%" stopColor="#6ec8ff" />
            <stop offset="100%" stopColor="#e8c36a" />
          </linearGradient>
          <linearGradient id="bm-fill" x1="6" y1="26" x2="26" y2="6">
            <stop offset="0%" stopColor="#3ce6d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#e8c36a" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="8"
          fill="url(#bm-fill)"
          stroke="url(#bm-mark)"
          strokeWidth="1.5"
        />
        <path
          d="M9 21.5 14 16l4 3.5L23 11"
          fill="none"
          stroke="url(#bm-mark)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="11" r="2.4" fill="#3ce6d4" />
        <path
          d="M9 21.5h5.5"
          fill="none"
          stroke="#e8c36a"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      {showText ? (
        <span className="truncate text-lg font-semibold tracking-tight">
          Better<span className="text-teal">Me</span>
        </span>
      ) : null}
    </div>
  );
}
