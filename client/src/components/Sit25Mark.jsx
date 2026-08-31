import { useId } from "react";

export default function Sit25Mark({
  className = "h-8 w-8",
  title = "Sit break",
}) {
  const uid = useId().replace(/:/g, "");
  const mark = `${uid}-mark`;
  const fill = `${uid}-fill`;

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={mark} x1="4" y1="28" x2="28" y2="4">
            <stop offset="0%" stopColor="#3ce6d4" />
            <stop offset="55%" stopColor="#6ec8ff" />
            <stop offset="100%" stopColor="#e8c36a" />
          </linearGradient>
          <linearGradient id={fill} x1="6" y1="26" x2="26" y2="6">
            <stop offset="0%" stopColor="#3ce6d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#e8c36a" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="14.5"
          fill={`url(#${fill})`}
          stroke={`url(#${mark})`}
          strokeWidth="1.5"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tracking-tight text-ink">
        25
      </span>
      {title ? <span className="sr-only">{title}</span> : null}
    </span>
  );
}
