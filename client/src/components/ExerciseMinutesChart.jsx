import { useMemo } from "react";

export const KINDS = [
  {
    id: "yoga",
    label: "Yoga",
    hint: "Mobility, breath, and calm",
    color: "#b9a6ff",
  },
  {
    id: "badminton",
    label: "Badminton",
    hint: "Footwork, rallies, and stamina",
    color: "#3ce6d4",
  },
  {
    id: "weight",
    label: "Weight training",
    hint: "Strength and progressive load",
    color: "#e8c36a",
  },
];

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

function dayKey(iso) {
  const d = new Date(iso);
  return ymd(d);
}

export function buildExerciseDays(sessions, dayCount = 30) {
  const byDay = new Map();
  for (const session of sessions) {
    const key = dayKey(session.recordedAt);
    if (!byDay.has(key)) {
      byDay.set(key, {
        day: key,
        minutes: 0,
        count: 0,
        feltSum: 0,
        feltCount: 0,
        byKind: { yoga: 0, badminton: 0, weight: 0 },
      });
    }
    const row = byDay.get(key);
    row.minutes += Number(session.durationMinutes) || 0;
    row.count += 1;
    if (session.felt != null) {
      row.feltSum += session.felt;
      row.feltCount += 1;
    }
    if (row.byKind[session.kind] != null) {
      row.byKind[session.kind] += Number(session.durationMinutes) || 0;
    }
  }

  const rows = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const key = ymd(daysAgo(i));
    const found = byDay.get(key);
    rows.push(
      found || {
        day: key,
        minutes: 0,
        count: 0,
        feltSum: 0,
        feltCount: 0,
        byKind: { yoga: 0, badminton: 0, weight: 0 },
      }
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

export default function ExerciseMinutesChart({ sessions, dayCount = 30 }) {
  const rows = useMemo(
    () => buildExerciseDays(sessions, dayCount),
    [sessions, dayCount]
  );

  const height = 240;
  const pad = { left: 40, right: 16, top: 16, bottom: 42 };
  const barGap = 6;
  const barW = 14;
  const plotWidth = rows.length * (barW + barGap);
  const width = pad.left + pad.right + plotWidth;
  const maxMinutes = Math.max(60, ...rows.map((row) => row.minutes));

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        Stacked minutes per day. Empty days stay blank so streaks are easy to
        see.
      </p>
      <div className="max-w-full overflow-x-auto rounded-xl border border-line/70 bg-[#171c2a]/50">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width, minWidth: width, height }}
          role="img"
          aria-label="Exercise minutes by day"
        >
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y =
              pad.top + (1 - frac) * (height - pad.top - pad.bottom);
            const mark = Math.round(maxMinutes * frac);
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
                  {mark}
                </text>
              </g>
            );
          })}
          {rows.map((row, i) => {
            const x = pad.left + i * (barW + barGap);
            const plotH = height - pad.top - pad.bottom;
            let y = height - pad.bottom;
            return (
              <g key={row.day}>
                {KINDS.map((kind) => {
                  const mins = row.byKind[kind.id] || 0;
                  if (!mins) return null;
                  const h = (mins / maxMinutes) * plotH;
                  y -= h;
                  return (
                    <rect
                      key={kind.id}
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx="2"
                      fill={kind.color}
                    >
                      <title>
                        {formatDay(row.day)} · {kind.label} {mins} min
                      </title>
                    </rect>
                  );
                })}
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
