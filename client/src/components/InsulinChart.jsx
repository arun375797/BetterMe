import { useMemo } from "react";

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function insulinDays(entries) {
  const map = new Map();
  for (const entry of entries) {
    const key = dayKey(entry.recordedAt);
    if (!map.has(key)) map.set(key, { key, total: 0, count: 0, sugarLevels: [] });
    const day = map.get(key);
    day.total += Number(entry.dose || 0);
    day.count += 1;
    if (entry.source === "sugar" && Number.isFinite(Number(entry.sugarLevel))) {
      day.sugarLevels.push(Number(entry.sugarLevel));
    }
  }
  return [...map.values()]
    .map((day) => ({
      ...day,
      sugarAverage: day.sugarLevels.length
        ? Math.round(day.sugarLevels.reduce((sum, value) => sum + value, 0) / day.sugarLevels.length)
        : null,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function label(key) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function InsulinChart({ entries, reference = 35 }) {
  const days = useMemo(() => insulinDays(entries), [entries]);
  if (!days.length) {
    return <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">Record insulin to see the daily trend.</div>;
  }
  const height = 320;
  const pad = { left: 48, right: 52, top: 28, bottom: 54 };
  const columnWidth = days.length > 31 ? 34 : days.length > 14 ? 46 : 62;
  const plotWidth = days.length * columnWidth;
  const width = pad.left + plotWidth + pad.right;
  const maxValue = Math.max(reference, ...days.map((day) => day.total), 10);
  const ceiling = Math.ceil(maxValue / 10) * 10;
  const chartHeight = height - pad.top - pad.bottom;
  const y = (value) => pad.top + (1 - value / ceiling) * chartHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(ceiling * part));
  const step = days.length > 45 ? 7 : days.length > 20 ? 3 : days.length > 10 ? 2 : 1;
  const sugarDays = days
    .map((day, index) => ({ ...day, index }))
    .filter((day) => day.sugarAverage != null);
  const sugarMax = sugarDays.length
    ? Math.max(200, Math.ceil(Math.max(...sugarDays.map((day) => day.sugarAverage)) / 50) * 50)
    : 200;
  const sugarY = (value) => pad.top + (1 - value / sugarMax) * chartHeight;
  const sugarPath = sugarDays
    .map((day, pointIndex) => {
      const x = pad.left + day.index * columnWidth + columnWidth / 2;
      return `${pointIndex ? "L" : "M"} ${x} ${sugarY(day.sugarAverage)}`;
    })
    .join(" ");

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>Daily totals from Sugar and direct insulin entries. Missing days are not treated as zero.</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan" />Insulin units</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-coral" /><span className="h-2 w-2 -ml-3 rounded-full bg-coral ring-2 ring-inset ring-surface" />Sugar from Sugar form</span>
      </div>
      <div data-lenis-prevent className="max-w-full overflow-x-auto rounded-xl border border-line/70 bg-inset">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recorded insulin units by day" style={{ width, minWidth: width, height }}>
          {ticks.map((tick) => <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#2a3142" strokeDasharray="4 6"/><text x={pad.left - 9} y={y(tick) + 4} fill="#93a0b5" fontSize="11" textAnchor="end">{tick}</text></g>)}
          {sugarDays.length ? [0, Math.round(sugarMax / 2), sugarMax].map((tick) => <text key={`sugar-tick-${tick}`} x={width - pad.right + 9} y={sugarY(tick) + 4} fill="#e88b7a" fontSize="10">{tick}</text>) : null}
          {reference > 0 && reference <= ceiling ? <g><line x1={pad.left} x2={width - pad.right} y1={y(reference)} y2={y(reference)} stroke="#e8c36a" strokeWidth="1.5" strokeDasharray="7 5"/><text x={pad.left + 5} y={y(reference) - 6} fill="#e8c36a" fontSize="10">reference {reference} u</text></g> : null}
          {days.map((day, index) => {
            const x = pad.left + index * columnWidth + 10;
            const barWidth = columnWidth - 20;
            const top = y(day.total);
            return <g key={day.key}><rect x={x} y={top} width={barWidth} height={height - pad.bottom - top} rx="5" fill="#6ec8ff" opacity="0.78"><title>{label(day.key)} · {day.total} units · {day.count} entries</title></rect><text x={x + barWidth / 2} y={Math.max(pad.top + 10, top - 6)} fill="#e9edf4" fontSize="10" textAnchor="middle">{day.total}</text>{index % step === 0 || index === days.length - 1 ? <text x={x + barWidth / 2} y={height - 24} fill="#93a0b5" fontSize="10" textAnchor="middle">{label(day.key)}</text> : null}</g>;
          })}
          {sugarDays.length > 1 ? <path d={sugarPath} fill="none" stroke="#e88b7a" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {sugarDays.map((day) => {
            const cx = pad.left + day.index * columnWidth + columnWidth / 2;
            const cy = sugarY(day.sugarAverage);
            return <g key={`sugar-${day.key}`}><circle cx={cx} cy={cy} r="5" fill="#e88b7a" stroke="#141824" strokeWidth="2"><title>{label(day.key)} · sugar average {day.sugarAverage} mg/dL · {day.sugarLevels.length} sugar-form {day.sugarLevels.length === 1 ? "reading" : "readings"}</title></circle><text x={cx} y={Math.max(12, cy - 9)} fill="#e88b7a" fontSize="10" fontWeight="600" textAnchor="middle">{day.sugarAverage}</text></g>;
          })}
          <text x="14" y={height / 2} fill="#93a0b5" fontSize="11" transform={`rotate(-90 14 ${height / 2})`} textAnchor="middle">Units per day</text>
          {sugarDays.length ? <text x={width - 8} y={height / 2} fill="#e88b7a" fontSize="10" transform={`rotate(90 ${width - 8} ${height / 2})`} textAnchor="middle">Sugar (mg/dL)</text> : null}
        </svg>
      </div>
    </div>
  );
}
