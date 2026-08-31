import { useMemo } from "react";

function pad(n) {
  return String(n).padStart(2, "0");
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function buildSleepDays(logs, dayCount = 30) {
  const byDay = new Map();
  for (const log of logs) {
    const key = log.day;
    byDay.set(key, {
      day: key,
      minutes: Number(log.durationMinutes) || 0,
      score: log.analysis?.overall ?? null,
    });
  }

  const rows = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const key = ymd(daysAgo(i));
    const found = byDay.get(key);
    rows.push(
      found || { day: key, minutes: 0, score: null }
    );
  }
  return rows;
}

function formatDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function scoreColor(score) {
  if (score == null) return "#4a5568";
  if (score >= 85) return "#3ce6d4";
  if (score >= 70) return "#b9a6ff";
  if (score >= 55) return "#e8c36a";
  return "#ff6b6b";
}

export default function SleepDurationChart({ logs, dayCount = 30 }) {
  const rows = useMemo(
    () => buildSleepDays(logs, dayCount),
    [logs, dayCount]
  );

  const height = 240;
  const pad = { left: 44, right: 16, top: 16, bottom: 42 };
  const barGap = 6;
  const barW = 14;
  const plotWidth = rows.length * (barW + barGap);
  const width = pad.left + pad.right + plotWidth;
  const maxMinutes = Math.max(480, ...rows.map((row) => row.minutes));
  const optimalMin = 7 * 60;
  const optimalMax = 9 * 60;

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        Hours slept per night (by wake date). Teal band marks the 7–9 hour
        target. Bar color reflects sleep quality score.
      </p>
      <div className="max-w-full overflow-x-auto rounded-xl border border-line/70 bg-[#171c2a]/50">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width, minWidth: width, height }}
          role="img"
          aria-label="Sleep duration by day"
        >
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y =
              pad.top + (1 - frac) * (height - pad.top - pad.bottom);
            const mark = Math.round((maxMinutes * frac) / 60);
            return (
              <g key={frac}>
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
                  {mark}h
                </text>
              </g>
            );
          })}

          <rect
            x={pad.left}
            y={
              height -
              pad.bottom -
              (optimalMax / maxMinutes) * (height - pad.top - pad.bottom)
            }
            width={plotWidth}
            height={
              ((optimalMax - optimalMin) / maxMinutes) *
              (height - pad.top - pad.bottom)
            }
            fill="#3ce6d4"
            opacity="0.08"
          />

          {rows.map((row, i) => {
            const x = pad.left + i * (barW + barGap);
            const plotH = height - pad.top - pad.bottom;
            const h = row.minutes
              ? (row.minutes / maxMinutes) * plotH
              : 0;
            const y = height - pad.bottom - h;
            return (
              <g key={row.day}>
                {h > 0 ? (
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx="2"
                    fill={scoreColor(row.score)}
                  >
                    <title>
                      {formatDay(row.day)} · {Math.round(row.minutes / 60)}h{" "}
                      {row.minutes % 60}m
                      {row.score != null ? ` · score ${row.score}` : ""}
                    </title>
                  </rect>
                ) : null}
                {i % 3 === 0 || i === rows.length - 1 ? (
                  <text
                    x={x + barW / 2}
                    y={height - 22}
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
