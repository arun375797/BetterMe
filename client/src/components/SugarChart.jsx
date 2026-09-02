import { useMemo } from "react";

const STATUS_COLOR = {
  low: "#6ec8ff",
  "in range": "#3ce6d4",
  elevated: "#e8c36a",
  high: "#e88b7a",
};

const TARGET_LOW = 70;
const TARGET_HIGH = 140;
const HIGH_LINE = 180;

function avg(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatWhen(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDay(ms) {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function pathFrom(points) {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

function groupDays(readings) {
  const map = new Map();
  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
  );
  for (const item of sorted) {
    const day = startOfDay(new Date(item.recordedAt).getTime());
    if (!map.has(day)) {
      map.set(day, {
        day,
        items: [],
      });
    }
    map.get(day).items.push(item);
  }
  return [...map.values()].map((group) => {
    const levels = group.items.map((item) => item.level);
    const before = group.items.filter((item) => item.mealTiming === "before");
    const after = group.items.filter((item) => item.mealTiming === "after");
    return {
      ...group,
      min: Math.min(...levels),
      max: Math.max(...levels),
      average: avg(levels),
      beforeAvg: avg(before.map((item) => item.level)),
      afterAvg: avg(after.map((item) => item.level)),
      highs: group.items.filter((item) => item.status === "high"),
    };
  });
}

function Diamond({ cx, cy, r, fill, stroke, title }) {
  const d = r + 1;
  return (
    <g>
      <polygon
        points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
      <title>{title}</title>
    </g>
  );
}

export default function SugarChart({ readings }) {
  const days = useMemo(() => groupDays(readings), [readings]);

  const insight = useMemo(() => {
    if (!readings.length) {
      return {
        inRange: 0,
        highCount: 0,
        afterHighs: 0,
        beforeHighs: 0,
        spikes: [],
      };
    }
    const high = readings.filter((item) => item.status === "high");
    const inRange = readings.filter((item) => item.status === "in range");
    return {
      inRange: Math.round((inRange.length / readings.length) * 100),
      highCount: high.length,
      afterHighs: high.filter((item) => item.mealTiming === "after").length,
      beforeHighs: high.filter((item) => item.mealTiming === "before").length,
      spikes: [...high]
        .sort((a, b) => b.level - a.level)
        .slice(0, 3),
    };
  }, [readings]);

  if (!readings.length) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-muted">
        Need readings in this filter to plot control.
      </div>
    );
  }

  const height = 440;
  const pad = { left: 58, right: 24, top: 28, bottom: 56 };
  const colW = days.length <= 8 ? 92 : days.length <= 16 ? 72 : 58;
  const plotWidth = days.length * colW;
  const width = pad.left + pad.right + plotWidth;
  const levels = readings.map((item) => item.level);
  const minY = 60;
  const maxY = Math.max(220, ...levels) + 16;
  const ySpan = maxY - minY;

  function xDay(index) {
    return pad.left + index * colW + colW / 2;
  }

  function xReading(item, index) {
    const t = new Date(item.recordedAt);
    const frac = (t.getHours() * 60 + t.getMinutes()) / (24 * 60);
    const inner = colW - 18;
    return pad.left + index * colW + 9 + frac * inner;
  }

  function xItems(items, index) {
    if (!items.length) return xDay(index);
    const sum = items.reduce((total, item) => total + xReading(item, index), 0);
    return sum / items.length;
  }

  function yLevel(level) {
    return pad.top + ((maxY - level) / ySpan) * (height - pad.top - pad.bottom);
  }

  const yTicks = [80, 100, 120, 140, 180, 220].filter(
    (mark) => mark >= minY && mark <= maxY
  );
  const bandTop = yLevel(TARGET_HIGH);
  const bandBottom = yLevel(TARGET_LOW);
  const dangerTop = yLevel(maxY);
  const dangerBottom = yLevel(HIGH_LINE);

  const dayIndexById = new Map();
  days.forEach((day, index) => {
    for (const item of day.items) dayIndexById.set(item._id, index);
  });

  function pointFor(item) {
    const index = dayIndexById.get(item._id) ?? 0;
    return {
      x: xReading(item, index),
      y: yLevel(item.level),
    };
  }

  const inOrder = [...readings].sort(
    (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
  );
  const readingLine = inOrder.map(pointFor);
  const beforeLine = inOrder
    .filter((item) => item.mealTiming === "before")
    .map(pointFor);
  const afterLine = inOrder
    .filter((item) => item.mealTiming === "after")
    .map(pointFor);

  const dayStep = days.length <= 10 ? 1 : days.length <= 21 ? 2 : 3;
  const mistakeNote =
    insight.afterHighs >= insight.beforeHighs && insight.highCount
      ? "Most highs are after food — meals or insulin timing."
      : insight.highCount
        ? "Most highs are before food — overnight or skipped dose."
        : "No high readings in this view.";

  return (
    <div>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <Insight
          label="Time in range"
          value={`${insight.inRange}%`}
          hint="green zone, 70–140"
          good={insight.inRange >= 70}
        />
        <Insight
          label="High mistakes"
          value={insight.highCount}
          hint={
            insight.highCount
              ? `${insight.afterHighs} after food · ${insight.beforeHighs} before`
              : "none in this view"
          }
          good={!insight.highCount}
        />
        <Insight
          label="Watch"
          value={insight.spikes[0] ? insight.spikes[0].level : "—"}
          hint={mistakeNote}
          good={!insight.highCount}
        />
      </div>

      <p className="mb-2 text-xs text-muted">
        Green band is the control zone. Scroll sideways. Hover a point for the
        exact reading.
      </p>
      <div className="max-w-full overflow-x-auto rounded-xl border border-line/70 bg-[#141824]">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width, minWidth: width, height }}
          role="img"
          aria-label="Sugar control by date"
        >
          <defs>
            <linearGradient id="targetBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ce6d4" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#3ce6d4" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <rect
            x={pad.left}
            y={bandTop}
            width={plotWidth}
            height={Math.max(0, bandBottom - bandTop)}
            fill="url(#targetBand)"
          />
          {dangerBottom > pad.top ? (
            <rect
              x={pad.left}
              y={dangerTop}
              width={plotWidth}
              height={Math.max(0, dangerBottom - dangerTop)}
              fill="#e88b7a"
              opacity="0.08"
            />
          ) : null}

          <text
            x={pad.left + 8}
            y={bandTop + 14}
            fill="#3ce6d4"
            fontSize="11"
            opacity="0.9"
          >
            In range
          </text>
          <text
            x={pad.left + 8}
            y={Math.max(pad.top + 14, dangerBottom - 8)}
            fill="#e88b7a"
            fontSize="11"
            opacity="0.85"
          >
            High / mistake
          </text>

          {yTicks.map((mark) => {
            const y = yLevel(mark);
            return (
              <g key={mark}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke={mark === TARGET_HIGH || mark === HIGH_LINE ? "#3a4358" : "#2a3142"}
                  strokeDasharray="4 6"
                />
                <text
                  x={pad.left - 10}
                  y={y + 4}
                  fill="#93a0b5"
                  fontSize="12"
                  textAnchor="end"
                >
                  {mark}
                </text>
              </g>
            );
          })}

          <text
            x="16"
            y={height / 2}
            fill="#93a0b5"
            fontSize="12"
            transform={`rotate(-90 16 ${height / 2})`}
            textAnchor="middle"
          >
            Sugar level (mg/dL)
          </text>

          {days.map((day, index) => {
            const x = xItems(day.items, index);
            const y1 = yLevel(day.max);
            const y2 = yLevel(day.min);
            return (
              <line
                key={`range-${day.day}`}
                x1={x}
                x2={x}
                y1={y1}
                y2={y2}
                stroke={day.highs.length ? "#e88b7a" : "#5b6780"}
                strokeWidth={day.highs.length ? 4 : 3}
                strokeLinecap="round"
                opacity={day.highs.length ? 0.55 : 0.28}
              />
            );
          })}

          <line
            x1={pad.left}
            y1={pad.top}
            x2={pad.left}
            y2={height - pad.bottom}
            stroke="#343c4d"
          />
          <line
            x1={pad.left}
            y1={height - pad.bottom}
            x2={width - pad.right}
            y2={height - pad.bottom}
            stroke="#343c4d"
          />

          {beforeLine.length > 1 ? (
            <path
              d={pathFrom(beforeLine)}
              fill="none"
              stroke="#3ce6d4"
              strokeWidth="1.8"
              strokeDasharray="6 5"
              opacity="0.55"
            />
          ) : null}
          {afterLine.length > 1 ? (
            <path
              d={pathFrom(afterLine)}
              fill="none"
              stroke="#e8c36a"
              strokeWidth="1.8"
              opacity="0.55"
            />
          ) : null}
          {readingLine.length > 1 ? (
            <path
              d={pathFrom(readingLine)}
              fill="none"
              stroke="#e9edf4"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {days.map((day, index) =>
            day.items.map((item) => {
              const cx = xReading(item, index);
              const cy = yLevel(item.level);
              const fill = STATUS_COLOR[item.status] || "#93a0b5";
              const title = `${formatWhen(item.recordedAt)} · ${item.level} mg/dL · ${
                item.mealTiming === "before" ? "before food" : "after food"
              }${item.insulinDose ? ` · insulin ${item.insulinDose} u` : ""}`;
              const high = item.status === "high";
              if (item.mealTiming === "after") {
                return (
                  <Diamond
                    key={item._id}
                    cx={cx}
                    cy={cy}
                    r={high ? 6 : 4.5}
                    fill={fill}
                    stroke="#141824"
                    title={title}
                  />
                );
              }
              return (
                <circle
                  key={item._id}
                  cx={cx}
                  cy={cy}
                  r={high ? 6 : 4.5}
                  fill={fill}
                  stroke="#141824"
                  strokeWidth="1.2"
                >
                  <title>{title}</title>
                </circle>
              );
            })
          )}

          {days.map((day, index) =>
            day.highs.map((item) => {
              const cx = xReading(item, index);
              const cy = yLevel(item.level);
              return (
                <text
                  key={`label-${item._id}`}
                  x={cx}
                  y={cy - 10}
                  fill="#e88b7a"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.level}
                </text>
              );
            })
          )}

          {days.map((day, index) => {
            if (index % dayStep !== 0 && index !== days.length - 1) return null;
            return (
              <text
                key={`tick-${day.day}`}
                x={xDay(index)}
                y={height - 22}
                fill="#93a0b5"
                fontSize="11"
                textAnchor="middle"
              >
                {formatDay(day.day)}
              </text>
            );
          })}
          <text
            x={pad.left + plotWidth / 2}
            y={height - 6}
            fill="#93a0b5"
            fontSize="12"
            textAnchor="middle"
          >
            Date
          </text>
        </svg>
      </div>

      {insight.spikes.length ? (
        <div className="mt-3 rounded-xl border border-coral/25 bg-coral/8 px-4 py-3">
          <p className="text-[11px] tracking-[0.16em] text-coral uppercase">
            Where it went wrong
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {insight.spikes.map((item) => (
              <span
                key={item._id}
                className="rounded-full border border-coral/30 bg-[#171c2a] px-3 py-1 text-xs"
              >
                <span className="font-semibold text-coral">{item.level}</span>
                <span className="text-muted">
                  {" "}
                  · {item.mealTiming === "before" ? "before" : "after"} food ·{" "}
                  {formatWhen(item.recordedAt)}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-teal">
          No high spikes in this filter. Control is holding.
        </p>
      )}
    </div>
  );
}

function Insight({ label, value, hint, good }) {
  return (
    <div className="rounded-xl border border-line bg-[#171c2a]/80 px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${good ? "text-teal" : "text-coral"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-4 text-muted">{hint}</p>
    </div>
  );
}
