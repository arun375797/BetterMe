import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getReportStats, peek } from "../api.js";

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null || Number.isNaN(Number(target))) {
      setValue(0);
      return undefined;
    }
    const end = Number(target);
    const startAt = performance.now();
    let frame = 0;

    function tick(now) {
      const p = Math.min(1, (now - startAt) / duration);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(end * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function polar(cx, cy, r, index, count) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function polygonPoints(cx, cy, r, count) {
  return Array.from({ length: count }, (_, i) => polar(cx, cy, r, i, count).join(
    ","
  )).join(" ");
}

function StatusRadar({ stats, max = 1000 }) {
  const count = stats.length || 8;
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 88;
  const rings = [0.25, 0.5, 0.75, 1];

  const valuePoints = stats
    .map((stat, i) =>
      polar(cx, cy, maxR * (Math.max(0, stat.value) / max), i, count).join(",")
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block h-auto w-full max-w-[300px]"
      role="img"
      aria-label="Attribute radar"
    >
      {rings.map((scale) => (
        <polygon
          key={scale}
          points={polygonPoints(cx, cy, maxR * scale, count)}
          fill="none"
          stroke="rgba(232,195,106,0.18)"
          strokeWidth="1"
        />
      ))}
      {stats.map((stat, i) => {
        const [x, y] = polar(cx, cy, maxR, i, count);
        return (
          <line
            key={stat.id}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(232,195,106,0.16)"
            strokeWidth="1"
          />
        );
      })}
      {stats.length ? (
        <polygon
          points={valuePoints}
          fill="rgba(60,230,212,0.16)"
          stroke="#3ce6d4"
          strokeWidth="2"
        />
      ) : null}
      {stats.map((stat, i) => {
        const [x, y] = polar(
          cx,
          cy,
          maxR * (Math.max(0, stat.value) / max),
          i,
          count
        );
        return <circle key={stat.id} cx={x} cy={y} r="3.2" fill={stat.color} />;
      })}
      {stats.map((stat, i) => {
        const [x, y] = polar(cx, cy, maxR + 26, i, count);
        return (
          <text
            key={stat.id}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={stat.color}
            fontSize="10"
            fontFamily="IBM Plex Mono, ui-monospace, monospace"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            {stat.label}
          </text>
        );
      })}
    </svg>
  );
}

function RankSeal({ rank, level }) {
  const shown = useCountUp(level);
  return (
    <div className="relative mx-auto h-[132px] w-[132px] sm:h-[148px] sm:w-[148px]">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <polygon
          points="50,4 93,26.5 93,73.5 50,96 7,73.5 7,26.5"
          fill="#0c111c"
          stroke={rank.color}
          strokeWidth="1.6"
          className="status-hex-glow"
          style={{ color: rank.color }}
        />
        <polygon
          points="50,12 86,31 86,69 50,88 14,69 14,31"
          fill="none"
          stroke={rank.color}
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-[10px] tracking-[0.28em] uppercase"
          style={{ color: rank.color }}
        >
          Rank
        </span>
        <span
          className="font-mono text-4xl font-black leading-none sm:text-5xl"
          style={{
            color: rank.color,
            textShadow: `0 0 22px ${rank.color}99`,
          }}
        >
          {rank.rank}
        </span>
        <span className="mt-0.5 font-mono text-lg font-bold tabular-nums text-ink">
          {shown}
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted uppercase">
          / 1000
        </span>
      </div>
    </div>
  );
}

function ResourceBar({ bar, color }) {
  const [width, setWidth] = useState(0);
  const shown = useCountUp(bar.current);
  const pct = bar.max ? Math.min(100, (bar.current / bar.max) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span
          className="font-mono text-[11px] font-bold tracking-[0.2em]"
          style={{ color }}
        >
          {bar.label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-ink/80">
          {shown}
          <span className="text-muted"> / {bar.max}</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-sm bg-[#0a0e16] ring-1 ring-white/8">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: width > 0 ? `0 0 10px ${color}55` : "none",
          }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted">{bar.hint}</p>
    </div>
  );
}

function StatRow({ stat, delay, open, onToggle }) {
  const [width, setWidth] = useState(0);
  const shown = useCountUp(stat.value, 800 + delay);
  const pct = stat.pct ?? 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  const guide = stat.guide;

  return (
    <div className="rounded-xl bg-[#0c111c]/70 ring-1 ring-white/6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span
          className="w-10 shrink-0 font-mono text-[11px] font-bold tracking-widest"
          style={{ color: stat.color }}
        >
          {stat.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="truncate text-sm text-ink">{stat.name}</span>
            <span className="flex items-center gap-2">
              {stat.decaying ? (
                <span className="text-[10px] tracking-wide text-coral uppercase">
                  decay
                </span>
              ) : null}
              {stat.trend === "up" ? (
                <span className="text-[11px] font-medium text-teal">
                  ▲ {stat.delta}
                </span>
              ) : stat.trend === "down" ? (
                <span className="text-[11px] font-medium text-coral">
                  ▼ {Math.abs(stat.delta)}
                </span>
              ) : null}
              <span
                className="font-mono text-[11px] font-bold"
                style={{ color: stat.color }}
              >
                {stat.grade}
              </span>
              <span
                className="min-w-[2.6rem] text-right font-mono text-sm font-semibold tabular-nums"
                style={{ color: stat.color }}
              >
                {shown}
              </span>
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-sm bg-[#070a10] ring-1 ring-white/5">
            <div
              className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
              style={{
                width: `${width}%`,
                background: `linear-gradient(90deg, ${stat.color}55, ${stat.color})`,
                boxShadow: width > 0 ? `0 0 10px ${stat.color}44` : "none",
              }}
            />
          </div>
        </div>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-white/6 px-3 py-3">
          <p className="text-[12px] text-ink/90">{stat.detail}</p>
          {guide ? (
            <>
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-gold/80 uppercase">
                  What this is
                </p>
                <p className="mt-1 text-[12px] text-ink/85">{guide.meaning}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-gold/80 uppercase">
                  Research bar
                </p>
                <p className="mt-1 text-[12px] text-muted">{guide.research}</p>
                <p className="mt-1 text-[12px] text-ink/85">{guide.target}</p>
              </div>
              {guide.compare?.length ? (
                <div className="overflow-hidden rounded-lg ring-1 ring-white/8">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 bg-[#070a10] px-2.5 py-1.5 font-mono text-[10px] tracking-wider text-muted uppercase">
                    <span>You vs target</span>
                    <span>You</span>
                    <span>Goal</span>
                  </div>
                  {guide.compare.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-t border-white/6 px-2.5 py-1.5 text-[12px]"
                    >
                      <span className="text-ink/85">{row.label}</span>
                      <span
                        className={`text-right font-mono tabular-nums ${
                          row.ok ? "text-teal" : "text-coral"
                        }`}
                      >
                        {row.you}
                      </span>
                      <span className="text-right font-mono tabular-nums text-muted">
                        {row.target}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {guide.steps?.length ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-gold/80 uppercase">
                    How to raise it
                  </p>
                  <ol className="mt-1 list-decimal space-y-1 pl-4 text-[12px] text-ink/85">
                    {guide.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {guide.next ? (
                <p className="rounded-lg bg-gold/8 px-2.5 py-2 text-[12px] text-gold">
                  Next: {guide.next}
                </p>
              ) : null}
            </>
          ) : null}
          <Link
            to={stat.href}
            className="inline-flex text-[12px] font-medium hover:underline"
            style={{ color: stat.color }}
          >
            Open {stat.source} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function ReportStatsPage() {
  const [report, setReport] = useState(() => peek("/api/report", "/stats"));
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getReportStats();
        setReport(data);
        setError("");
        if (data?.awakened && data?.weakest?.id) setOpenId(data.weakest.id);
        else setOpenId("vit");
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  const computedLabel = useMemo(() => {
    if (!report?.computedAt) return "";
    try {
      return new Date(report.computedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [report?.computedAt]);

  if (!report && !error) {
    return (
      <div className="page-pad">
        <p className="text-[12px] tracking-[0.18em] text-gold uppercase">
          My Report · Statistics
        </p>
        <p className="mt-6 text-sm text-muted">Opening status window…</p>
      </div>
    );
  }

  const {
    statMax = 1000,
    level,
    levelDelta,
    rank,
    class: klass,
    hp,
    mp,
    stats,
    effects,
    quests,
    strongest,
    weakest,
    summary,
    awakened,
  } = report || {};

  return (
    <div className="page-pad">
      <p className="text-[12px] tracking-[0.18em] text-gold uppercase">
        My Report · Statistics
      </p>
      <h2 className="mt-2 text-2xl font-semibold break-words sm:text-3xl">
        Status Window
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Level 0 to 1000. Empty logs are zero — nothing is gifted. One strong
        week is only ~100–140 on a stat. 1000 is about twelve weeks of hitting
        the research floors. Tap any attribute to see how to raise it.
      </p>
      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      {report ? (
        <div
          id="jump-status"
          data-jump="Status"
          className="status-window mt-8 rounded-2xl p-4 sm:p-7"
        >
          <span className="status-corner status-corner-tl" />
          <span className="status-corner status-corner-tr" />
          <span className="status-corner status-corner-bl" />
          <span className="status-corner status-corner-br" />
          <span className="status-scan" aria-hidden="true" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] tracking-[0.32em] text-gold/80 uppercase">
                Status Window
              </p>
              {computedLabel ? (
                <p className="font-mono text-[10px] text-muted">
                  Synced {computedLabel}
                </p>
              ) : null}
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
              {rank ? <RankSeal rank={rank} level={level} /> : null}
              <div className="min-w-0">
                <p className="text-[11px] tracking-[0.2em] text-gold/80 uppercase">
                  {rank?.title}
                </p>
                <h3
                  className="mt-1 text-2xl font-bold sm:text-3xl"
                  style={{ color: rank?.color }}
                >
                  {klass?.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{klass?.epithet}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {awakened && levelDelta > 0 ? (
                    <span className="text-teal">▲ {levelDelta} vs last week</span>
                  ) : awakened && levelDelta < 0 ? (
                    <span className="text-coral">
                      ▼ {Math.abs(levelDelta)} vs last week
                    </span>
                  ) : (
                    <span className="text-muted">
                      {awakened
                        ? "Level steady vs last week"
                        : "No XP until something is logged"}
                    </span>
                  )}
                  {strongest && strongest.value > 0 ? (
                    <span className="text-muted">
                      Peak {strongest.name} {strongest.value}
                    </span>
                  ) : null}
                  {awakened && weakest ? (
                    <span className="text-muted">
                      Weak {weakest.name} {weakest.value}
                    </span>
                  ) : null}
                </div>

                {hp && mp ? (
                  <div className="mt-4 space-y-3">
                    <ResourceBar bar={hp} color="#e88b7a" />
                    <ResourceBar bar={mp} color="#6ec8ff" />
                  </div>
                ) : null}

                <div className="mt-4">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                      Rank XP
                    </span>
                    <span className="font-mono text-[11px] text-muted tabular-nums">
                      {rank?.nextAt == null
                        ? "Max rank"
                        : `${rank.xpInto} / ${rank.xpNeed} → ${rank.nextRank}`}
                    </span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-sm bg-[#0a0e16] ring-1 ring-gold/20">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold/50 to-gold transition-[width] duration-700"
                      style={{ width: `${rank?.xpPct ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {rank?.nextAt == null
                      ? "SS-Rank is the ceiling. Keep logging or decay pulls you down."
                      : `${rank.pointsToNext} level points to ${rank.nextTitle}.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <MiniStat
                label="Streak"
                value={`${summary?.exerciseStreak ?? 0}d`}
              />
              <MiniStat
                label="Exercise"
                value={`${summary?.weekExerciseMinutes ?? 0}m`}
              />
              <MiniStat
                label="Sleep"
                value={`${summary?.sleepNights ?? 0}n`}
              />
              <MiniStat
                label="Food"
                value={
                  summary?.foodAdherence != null
                    ? `${summary.foodAdherence}%`
                    : "—"
                }
              />
              <MiniStat
                label="Study"
                value={`${summary?.studyComplete ?? 0}d`}
              />
            </div>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

            <div
              id="jump-attributes"
              data-jump="Attributes"
              className="grid items-start gap-8 lg:grid-cols-[minmax(0,300px)_1fr]"
            >
              <div>
                <p className="mb-3 text-center font-mono text-[11px] tracking-[0.28em] text-gold/70 uppercase">
                  Attribute Map
                </p>
                <StatusRadar stats={stats || []} max={statMax} />
                <p className="mt-2 text-center text-[11px] text-muted">
                  Each axis is 0–1000. A tiny shape means you are still early.
                </p>
              </div>
              <div>
                <p className="mb-1 font-mono text-[11px] tracking-[0.28em] text-gold/70 uppercase">
                  Attributes
                </p>
                <p className="mb-3 text-[11px] text-muted">
                  Tap a row. Compare your week with the research target, then
                  follow the next step.
                </p>
                <div className="space-y-2">
                  {(stats || []).map((stat, i) => (
                    <StatRow
                      key={stat.id}
                      stat={stat}
                      delay={i * 50}
                      open={openId === stat.id}
                      onToggle={() =>
                        setOpenId((id) => (id === stat.id ? null : stat.id))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {effects?.length ? (
              <div id="jump-effects" data-jump="Effects">
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
                <p className="mb-3 font-mono text-[11px] tracking-[0.28em] text-gold/70 uppercase">
                  Active Effects
                </p>
                <div className="flex flex-wrap gap-2">
                  {effects.map((effect) => (
                    <div
                      key={effect.name}
                      className={`rounded-lg px-3 py-2 ring-1 ${
                        effect.kind === "buff"
                          ? "bg-teal/8 ring-teal/25"
                          : effect.kind === "debuff"
                            ? "bg-coral/8 ring-coral/25"
                            : "bg-gold/8 ring-gold/25"
                      }`}
                    >
                      <p
                        className={`text-[12px] font-semibold ${
                          effect.kind === "buff"
                            ? "text-teal"
                            : effect.kind === "debuff"
                              ? "text-coral"
                              : "text-gold"
                        }`}
                      >
                        {effect.kind === "buff"
                          ? "▲ "
                          : effect.kind === "debuff"
                            ? "▼ "
                            : "◆ "}
                        {effect.name}
                      </p>
                      <p className="text-[11px] text-muted">{effect.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {quests?.length ? (
              <div id="jump-quests" data-jump="Quests">
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
                <p className="mb-3 font-mono text-[11px] tracking-[0.28em] text-gold/70 uppercase">
                  Daily Quests
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {quests.map((quest) => (
                    <Link
                      key={quest.id}
                      to={quest.href}
                      className="rounded-xl bg-[#0c111c]/80 p-3 ring-1 ring-white/8 transition hover:bg-white/5 hover:ring-gold/30"
                    >
                      <p
                        className="font-mono text-[10px] tracking-[0.2em] font-bold"
                        style={{ color: quest.color }}
                      >
                        {quest.tag}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {quest.title}
                      </p>
                      <p className="mt-1 text-[12px] text-muted">{quest.detail}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-sm bg-white/8">
                        <div
                          className="h-full"
                          style={{
                            width: `${quest.progress ?? 0}%`,
                            background: quest.color,
                          }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mt-6 text-center text-[11px] text-muted">
              Scores use this week, the last 30 days, and the last 90 days
              against WHO / ACSM / NSF / ADA-style floors, plus your Learning
              mix. Skip a few days and awakened stats decay. Knowledge reads
              study sessions you mark done — not subjects sitting in the
              library.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#0c111c]/80 px-3 py-2 ring-1 ring-white/6">
      <p className="text-[10px] tracking-wider text-muted uppercase">{label}</p>
      <p className="font-mono text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
