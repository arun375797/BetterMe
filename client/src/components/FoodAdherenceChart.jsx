import { useMemo } from "react";

const SLOTS = ["morning", "afternoon", "evening", "night"];

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function buildDayRows(logs, dayCount = 30) {
  const byDay = new Map();
  for (const log of logs) {
    if (!byDay.has(log.day)) byDay.set(log.day, {});
    byDay.get(log.day)[log.slot] = log;
  }

  const rows = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const key = ymd(daysAgo(i));
    const slots = byDay.get(key) || {};
    const eaten = SLOTS.filter((slot) => slots[slot]?.status === "eaten").length;
    const skipped = SLOTS.filter(
      (slot) => slots[slot]?.status === "skipped"
    ).length;
    const missing = 4 - eaten - skipped;
    rows.push({
      day: key,
      slots,
      eaten,
      skipped: skipped + missing,
      complete: eaten === 4,
    });
  }
  return rows;
}

export default function FoodAdherenceChart({ logs, dayCount = 30 }) {
  const rows = useMemo(() => buildDayRows(logs, dayCount), [logs, dayCount]);

  const height = 220;
  const pad = { left: 36, right: 16, top: 16, bottom: 42 };
  const barGap = 6;
  const barW = 14;
  const plotWidth = rows.length * (barW + barGap);
  const width = pad.left + pad.right + plotWidth;

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        Teal is meals eaten. Coral is skipped or not recorded. Four teal means
        that day was complete.
      </p>
      <div className="max-w-full overflow-x-auto rounded-xl border border-line/70 bg-[#171c2a]/50">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width, minWidth: width, height }}
          role="img"
          aria-label="Meals eaten versus missed by day"
        >
          {[1, 2, 3, 4].map((mark) => {
            const y =
              pad.top +
              ((4 - mark) / 4) * (height - pad.top - pad.bottom);
            return (
              <g key={mark}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="#343c4d"
                  strokeDasharray="4 6"
                />
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  fill="#93a0b5"
                  fontSize="11"
                  textAnchor="end"
                >
                  {mark}
                </text>
              </g>
            );
          })}
          {rows.map((row, i) => {
            const x = pad.left + i * (barW + barGap);
            const plotH = height - pad.top - pad.bottom;
            const eatenH = (row.eaten / 4) * plotH;
            const missH = (row.skipped / 4) * plotH;
            return (
              <g key={row.day}>
                <rect
                  x={x}
                  y={height - pad.bottom - missH - eatenH}
                  width={barW}
                  height={missH}
                  fill="#e88b7a"
                  opacity="0.85"
                >
                  <title>
                    {formatDay(row.day)} · eaten {row.eaten}/4 · missed{" "}
                    {row.skipped}
                  </title>
                </rect>
                <rect
                  x={x}
                  y={height - pad.bottom - eatenH}
                  width={barW}
                  height={eatenH}
                  fill="#3ce6d4"
                >
                  <title>
                    {formatDay(row.day)} · eaten {row.eaten}/4 · missed{" "}
                    {row.skipped}
                  </title>
                </rect>
                {i % 3 === 0 ? (
                  <text
                    x={x + barW / 2}
                    y={height - 18}
                    fill="#93a0b5"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatDay(row.day)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
