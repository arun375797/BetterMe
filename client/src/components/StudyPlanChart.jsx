import { useMemo } from "react";
import { accentMap } from "../theme.jsx";
import { todayKey } from "../food.js";

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

export function formatStudyDay(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  if (!y) return key;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function shortDay(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function countStatus(groups, kind, status) {
  return (groups || []).filter((group) => group[kind]?.status === status)
    .length;
}

export function buildStudyRows(historyDays, dayCount = 30) {
  const byDay = Object.fromEntries(
    (historyDays || []).map((day) => [day.key, day])
  );
  const rows = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const key = ymd(daysAgo(i));
    const found = byDay[key];
    const groups = found?.groups || [];
    const planned = groups.length * 2;
    const theory = countStatus(groups, "theory", "done");
    const practical = countStatus(groups, "practical", "done");
    const skipped =
      countStatus(groups, "theory", "skipped") +
      countStatus(groups, "practical", "skipped");
    const done = theory + practical;
    const missing = Math.max(0, planned - done - skipped);
    rows.push({
      day: key,
      groups,
      planned,
      theory,
      practical,
      skipped,
      missing,
      done,
      complete: Boolean(found?.complete),
      label: groups
        .map((group) => group.subject?.shortName)
        .filter(Boolean)
        .join(" · "),
    });
  }
  return rows;
}

function dayTitle(row) {
  const bits = (row.groups || []).map((group) => {
    const name = group.subject?.shortName || "Subject";
    const theory = group.theory?.topic?.title || group.theory?.status || "—";
    const practical =
      group.practical?.topic?.title || group.practical?.status || "—";
    return `${name}: T ${theory} · P ${practical}`;
  });
  return `${formatStudyDay(row.day)}${row.label ? ` · ${row.label}` : ""}${
    bits.length ? `\n${bits.join("\n")}` : " · nothing logged"
  }`;
}

export default function StudyPlanChart({
  historyDays = [],
  dayCount = 30,
  selectedKey,
  weekKeys = [],
  onSelectDay,
}) {
  const rows = useMemo(
    () => buildStudyRows(historyDays, dayCount),
    [historyDays, dayCount]
  );
  const weekSet = new Set(weekKeys);
  const today = todayKey();
  const maxSessions = Math.max(4, ...rows.map((row) => row.planned || 0), 4);

  const height = 220;
  const pad = { left: 36, right: 16, top: 16, bottom: 42 };
  const barGap = 6;
  const barW = 14;
  const plotWidth = rows.length * (barW + barGap);
  const width = pad.left + pad.right + plotWidth;
  const plotH = height - pad.top - pad.bottom;

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        Sessions marked done each day. Teal is theory, gold is practical. Coral
        is skipped or not logged against the mix.
      </p>
      <div className="max-w-full overflow-x-auto rounded-xl border border-line/70 bg-[#171c2a]/50">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width, minWidth: width, height }}
          role="img"
          aria-label="Study sessions by day for the last 30 days"
        >
          {Array.from({ length: maxSessions }, (_, i) => i + 1).map((mark) => {
            const y = pad.top + ((maxSessions - mark) / maxSessions) * plotH;
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
            const miss = row.skipped + row.missing;
            const missH = (miss / maxSessions) * plotH;
            const theoryH = (row.theory / maxSessions) * plotH;
            const practicalH = (row.practical / maxSessions) * plotH;
            const clickable = weekSet.has(row.day);
            return (
              <g
                key={row.day}
                className={clickable ? "cursor-pointer" : undefined}
                onClick={() => {
                  if (clickable) onSelectDay?.(row.day);
                }}
              >
                {missH > 0 ? (
                  <rect
                    x={x}
                    y={height - pad.bottom - missH - theoryH - practicalH}
                    width={barW}
                    height={missH}
                    fill="#e88b7a"
                    opacity="0.85"
                  />
                ) : null}
                {practicalH > 0 ? (
                  <rect
                    x={x}
                    y={height - pad.bottom - theoryH - practicalH}
                    width={barW}
                    height={practicalH}
                    fill="#e8c36a"
                  />
                ) : null}
                {theoryH > 0 ? (
                  <rect
                    x={x}
                    y={height - pad.bottom - theoryH}
                    width={barW}
                    height={theoryH}
                    fill="#3ce6d4"
                  />
                ) : null}
                {row.day === today || row.day === selectedKey ? (
                  <rect
                    x={x - 1}
                    y={pad.top}
                    width={barW + 2}
                    height={plotH}
                    fill="none"
                    stroke={row.day === selectedKey ? "#3ce6d4" : "#e8c36a"}
                    strokeOpacity="0.45"
                    rx="2"
                  />
                ) : null}
                <title>{dayTitle(row)}</title>
                {i % 3 === 0 || i === rows.length - 1 ? (
                  <text
                    x={x + barW / 2}
                    y={height - 18}
                    fill="#93a0b5"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {shortDay(row.day)}
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

export function StudySubjectBars({ bySubject = [] }) {
  const max = Math.max(
    1,
    ...bySubject.map((item) => (item.theory || 0) + (item.practical || 0))
  );

  if (!bySubject.length) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {bySubject.map((item) => {
        const accent = accentMap[item.accent] || accentMap.teal;
        const theoryPct = ((item.theory || 0) / max) * 100;
        const practicalPct = ((item.practical || 0) / max) * 100;
        return (
          <div
            key={item._id}
            className="rounded-2xl border border-line bg-[#222838]/80 px-4 py-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className={`text-sm font-medium ${accent.text}`}>
                {item.name}
              </p>
              <p className="text-xs tabular-nums text-muted">
                {item.theory || 0} · {item.practical || 0}
              </p>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-sm bg-[#171c2a] ring-1 ring-white/8">
              <span
                className="h-full bg-teal"
                style={{ width: `${theoryPct}%` }}
              />
              <span
                className={`h-full ${accent.bar}`}
                style={{ width: `${practicalPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {item.lastDone
                ? `Last ${formatStudyDay(item.lastDone)}`
                : "Not studied in 30 days"}
              {item.lastTheory?.title ? ` · ${item.lastTheory.title}` : ""}
              {item.lastPractical?.title
                ? ` · ${item.lastPractical.title}`
                : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
