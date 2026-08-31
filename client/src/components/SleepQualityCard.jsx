import { SLEEP_GUIDE, analyzeSleep } from "../lib/sleepStats.js";

function ScoreBar({ label, value, hint, color = "#b9a6ff" }) {
  if (value == null) return null;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

export default function SleepQualityCard({ log, compact = false }) {
  if (!log) {
    return (
      <div className="rounded-2xl border border-line bg-[#222838]/80 p-5">
        <p className="text-sm text-muted">No sleep logged yet.</p>
      </div>
    );
  }

  const analysis = log.analysis || analyzeSleep(log);

  if (compact) {
    return (
      <div className="rounded-2xl border border-line bg-[#222838]/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Last night</p>
            <p className="mt-1 text-2xl font-semibold">
              {analysis.durationLabel}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {log.bedTime} → {log.wakeTime}
            </p>
          </div>
          <div
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2"
            style={{ borderColor: analysis.color }}
          >
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: analysis.color }}
            >
              {analysis.overall}
            </span>
            <span className="text-[9px] text-muted">/100</span>
          </div>
        </div>
        <p
          className="mt-2 text-sm font-medium"
          style={{ color: analysis.color }}
        >
          {analysis.label}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-[#222838]/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
            Sleep quality
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {analysis.durationLabel}
          </p>
          <p className="mt-1 text-sm text-muted">
            Bed {log.bedDate} at {log.bedTime} · Woke {log.wakeDate} at{" "}
            {log.wakeTime}
          </p>
        </div>
        <div className="text-center">
          <div
            className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-full border-[3px]"
            style={{ borderColor: analysis.color }}
          >
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: analysis.color }}
            >
              {analysis.overall}
            </span>
            <span className="text-[10px] text-muted">/ 100</span>
          </div>
          <p
            className="mt-2 text-sm font-semibold"
            style={{ color: analysis.color }}
          >
            {analysis.label}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <ScoreBar
          label="Duration"
          value={analysis.durationScore}
          hint={analysis.durationHint}
          color="#3ce6d4"
        />
        <ScoreBar
          label="Cycle alignment"
          value={analysis.cycleScore}
          hint={analysis.cycleHint}
          color="#b9a6ff"
        />
        {analysis.subjectiveScore != null ? (
          <ScoreBar
            label="How you felt"
            value={analysis.subjectiveScore}
            hint={`You rated ${log.quality}/10`}
            color="#e8c36a"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-line/60 p-3">
            <p className="text-xs text-muted">How you felt</p>
            <p className="mt-1 text-sm text-muted/80">
              Add a 1–10 rating next time for a fuller score.
            </p>
          </div>
        )}
      </div>

      <details className="mt-5 group">
        <summary className="cursor-pointer text-xs text-coral hover:underline">
          How is this calculated?
        </summary>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
          <p>
            Sleep happens in ~{SLEEP_GUIDE.cycleMinutes}-minute cycles (light →
            deep → REM). Adults typically need {SLEEP_GUIDE.recommendedCyclesMin}
            –{SLEEP_GUIDE.recommendedCyclesMax} full cycles (
            {SLEEP_GUIDE.optimalHoursMin}–{SLEEP_GUIDE.optimalHoursMax} hours).
          </p>
          <p>
            Your score blends duration (how close to 7–9 hours), cycle alignment
            (waking near the end of a ~90 min cycle feels more refreshing), and
            your own rating if you gave one.
          </p>
          <p>
            This is a simple guide, not medical advice. Consistent bedtimes and
            wake times matter as much as total hours.
          </p>
        </div>
      </details>
    </div>
  );
}
