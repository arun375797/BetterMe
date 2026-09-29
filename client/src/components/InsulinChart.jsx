import { useMemo } from "react";

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function insulinDays(entries) {
  const map = new Map();
  for (const entry of entries) {
    const key = dayKey(entry.recordedAt);
    if (!map.has(key)) map.set(key, { key, total: 0, count: 0, entries: [], sugarReadings: [] });
    const day = map.get(key);
    day.total += Number(entry.dose || 0);
    day.count += 1;
    day.entries.push(entry);
    if (entry.source === "sugar" && Number.isFinite(Number(entry.sugarLevel))) {
      day.sugarReadings.push({
        level: Number(entry.sugarLevel),
        recordedAt: entry.recordedAt,
        dose: Number(entry.dose || 0),
      });
    }
  }
  return [...map.values()]
    .map((day) => ({
      ...day,
      sugarAverage: day.sugarReadings.length
        ? Math.round(day.sugarReadings.reduce((sum, item) => sum + item.level, 0) / day.sugarReadings.length)
        : null,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function label(key) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(value) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function compactTimes(entries) {
  const times = entries.map((entry) => timeLabel(entry.recordedAt));
  if (times.length <= 2) return times.join(" · ");
  return `${times.slice(0, 2).join(" · ")} +${times.length - 2}`;
}

export default function InsulinChart({ entries, reference = 35 }) {
  const days = useMemo(() => insulinDays(entries), [entries]);
  if (!days.length) {
    return <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">Record insulin to see the daily trend.</div>;
  }
  const height = 320;
  const pad = { left: 48, right: 52, top: 32, bottom: 76 };
  const columnWidth = days.length > 31 ? 34 : days.length > 14 ? 46 : 62;
  const plotWidth = days.length * columnWidth;
  const width = pad.left + plotWidth + pad.right;
  const maxValue = Math.max(reference, ...days.map((day) => day.total), 10);
  const ceiling = Math.ceil(maxValue / 10) * 10;
  const chartHeight = height - pad.top - pad.bottom;
  const y = (value) => pad.top + (1 - value / ceiling) * chartHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(ceiling * part));
  const step = days.length > 45 ? 7 : days.length > 20 ? 3 : days.length > 10 ? 2 : 1;
  const sugarPoints = days.flatMap((day, dayIndex) =>
    day.sugarReadings.map((reading) => {
      const date = new Date(reading.recordedAt);
      const minuteOfDay = date.getHours() * 60 + date.getMinutes();
      const x = pad.left + dayIndex * columnWidth + 7 + (minuteOfDay / (24 * 60)) * (columnWidth - 14);
      return { ...reading, dayKey: day.key, dayIndex, x };
    })
  );
  const sugarMax = sugarPoints.length
    ? Math.max(200, Math.ceil(Math.max(...sugarPoints.map((point) => point.level)) / 50) * 50)
    : 200;
  const sugarY = (value) => pad.top + (1 - value / sugarMax) * chartHeight;
  const sugarPath = sugarPoints
    .map((point, pointIndex) => {
      return `${pointIndex ? "L" : "M"} ${point.x} ${sugarY(point.level)}`;
    })
    .join(" ");

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>Daily totals from Sugar and direct insulin entries. Missing days are not treated as zero.</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan" />Insulin units</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-coral" /><span className="h-2 w-2 -ml-3 rounded-full bg-coral ring-2 ring-inset ring-surface" />Sugar reading and time</span>
      </div>
      <div data-lenis-prevent className="max-w-full overflow-x-auto rounded-xl border border-line/70 bg-inset">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recorded insulin units by day" style={{ width, minWidth: width, height }}>
          {ticks.map((tick) => <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#2a3142" strokeDasharray="4 6"/><text x={pad.left - 9} y={y(tick) + 4} fill="#93a0b5" fontSize="11" textAnchor="end">{tick}</text></g>)}
          {sugarPoints.length ? [0, Math.round(sugarMax / 2), sugarMax].map((tick) => <text key={`sugar-tick-${tick}`} x={width - pad.right + 9} y={sugarY(tick) + 4} fill="#e88b7a" fontSize="10">{tick}</text>) : null}
          {reference > 0 && reference <= ceiling ? <g><line x1={pad.left} x2={width - pad.right} y1={y(reference)} y2={y(reference)} stroke="#e8c36a" strokeWidth="1.5" strokeDasharray="7 5"/><text x={pad.left + 5} y={y(reference) - 6} fill="#e8c36a" fontSize="10">reference {reference} u</text></g> : null}
          {days.map((day, index) => {
            const x = pad.left + index * columnWidth + 10;
            const barWidth = columnWidth - 20;
            const top = y(day.total);
            return <g key={day.key}><rect x={x} y={top} width={barWidth} height={height - pad.bottom - top} rx="5" fill="#6ec8ff" opacity="0.78"><title>{label(day.key)} · {day.total} units · {day.count} entries · {day.entries.map((entry) => `${timeLabel(entry.recordedAt)}: ${entry.dose} u`).join(" · ")}</title></rect><text x={x + barWidth / 2} y={Math.max(pad.top + 10, top - 6)} fill="#e9edf4" fontSize="10" textAnchor="middle">{day.total}</text>{index % step === 0 || index === days.length - 1 ? <><text x={x + barWidth / 2} y={height - 38} fill="#93a0b5" fontSize="10" textAnchor="middle">{label(day.key)}</text><text x={x + barWidth / 2} y={height - 20} fill="#6ec8ff" fontSize="8.5" textAnchor="middle">{compactTimes(day.entries)}</text></> : null}</g>;
          })}
          {sugarPoints.length > 1 ? <path d={sugarPath} fill="none" stroke="#e88b7a" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {sugarPoints.map((point, index) => {
            const cy = sugarY(point.level);
            return <g key={`sugar-${point.dayKey}-${point.recordedAt}-${index}`}><circle cx={point.x} cy={cy} r="5" fill="#e88b7a" stroke="#141824" strokeWidth="2"><title>{label(point.dayKey)} at {timeLabel(point.recordedAt)} · sugar {point.level} mg/dL · insulin {point.dose} u</title></circle><text x={point.x} y={Math.max(12, cy - 11)} fill="#e88b7a" fontSize="10" fontWeight="600" textAnchor="middle">{point.level}</text><text x={point.x} y={Math.min(height - pad.bottom - 4, cy + 15)} fill="#e88b7a" fontSize="8" textAnchor="middle">{timeLabel(point.recordedAt)}</text></g>;
          })}
          <text x="14" y={height / 2} fill="#93a0b5" fontSize="11" transform={`rotate(-90 14 ${height / 2})`} textAnchor="middle">Units per day</text>
          {sugarPoints.length ? <text x={width - 8} y={height / 2} fill="#e88b7a" fontSize="10" transform={`rotate(90 ${width - 8} ${height / 2})`} textAnchor="middle">Sugar (mg/dL)</text> : null}
        </svg>
      </div>
    </div>
  );
}
