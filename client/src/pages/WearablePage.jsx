import { useEffect, useMemo, useState } from "react";
import { getWearableData, peekWearableData } from "../api.js";

const number = new Intl.NumberFormat();

function valueOrDash(value, suffix = "") {
  return value == null ? "—" : `${number.format(Math.round(value))}${suffix}`;
}

function km(value) {
  return value == null ? "—" : `${(value / 1000).toFixed(2)} km`;
}

function kcal(value) {
  return value == null ? "—" : `${number.format(Math.round(value))} kcal`;
}

function dayLabel(day) {
  if (!day) return "No sync yet";
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export default function WearablePage() {
  const cached = peekWearableData(30);
  const [records, setRecords] = useState(() => cached?.records || []);
  const [error, setError] = useState("");

  useEffect(() => {
    getWearableData(30)
      .then((data) => {
        setRecords(data.records || []);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, []);

  const latest = records[0];
  const stepMax = useMemo(
    () => Math.max(10000, ...records.map((item) => item.steps || 0)),
    [records]
  );

  return (
    <div className="page-pad">
      <p className="text-[12px] tracking-[0.18em] text-coral uppercase">My Health</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Galaxy Fit3</h2>
          <p className="mt-2 text-sm text-muted">
            Health Connect data synced by the BetterMe Health Android app.
          </p>
        </div>
        <p className="rounded-full border border-line bg-raised px-3 py-1.5 text-xs text-muted">
          {dayLabel(latest?.day)}
        </p>
      </div>
      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      {!latest ? (
        <div className="mt-8 rounded-2xl border border-line bg-raised/80 p-6">
          <h3 className="font-semibold">No Fit3 data has been synced</h3>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Open BetterMe Health on your Android phone, grant the requested Health Connect
            permissions, then tap Sync to BetterMe.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <p className="text-[12px] tracking-[0.18em] text-muted uppercase">Today</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Steps" value={valueOrDash(latest.steps)} hint="Daily movement" tone="teal" />
              <Metric label="Heart rate" value={valueOrDash(latest.heartRate?.latest, " bpm")} hint={latest.heartRate?.average ? `Average ${latest.heartRate.average} bpm` : "No reading"} tone="coral" />
              <Metric label="Blood oxygen" value={valueOrDash(latest.oxygen?.latest, "%")} hint={latest.oxygen?.minimum ? `Range ${latest.oxygen.minimum}–${latest.oxygen.maximum}%` : "No reading"} tone="cyan" />
              <Metric label="Active calories" value={kcal(latest.activeCaloriesKcal)} hint={latest.totalCaloriesKcal != null ? `${kcal(latest.totalCaloriesKcal)} total` : "From Health Connect"} tone="gold" />
              <Metric label="Distance" value={km(latest.distanceMeters)} hint="Walking and workouts" />
              <Metric label="Floors" value={valueOrDash(latest.floors)} hint="Floors climbed" />
              <Metric label="Exercise" value={valueOrDash(latest.exerciseMinutes, " min")} hint={`${latest.workouts?.length || 0} workout sessions`} />
              <Metric label="Resting heart rate" value={valueOrDash(latest.heartRate?.resting, " bpm")} hint="When supplied by Samsung Health" />
            </div>
          </section>

          <section className="mt-10 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-line bg-raised/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Steps · last 30 days</h3>
                <span className="text-xs text-muted">Goal line: 10,000</span>
              </div>
              <div className="mt-5 space-y-3">
                {records.map((record) => (
                  <div key={record.day} className="grid grid-cols-[68px_1fr_64px] items-center gap-3 text-xs">
                    <span className="text-muted">{record.day.slice(5)}</span>
                    <div className="relative h-2.5 overflow-hidden rounded-full bg-inset">
                      <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, ((record.steps || 0) / stepMax) * 100)}%` }} />
                      <span className="absolute inset-y-0 w-px bg-gold/80" style={{ left: `${Math.min(100, (10000 / stepMax) * 100)}%` }} />
                    </div>
                    <span className="text-right text-ink">{valueOrDash(record.steps)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-raised/80 p-5">
                <h3 className="font-semibold">Heart range</h3>
                <p className="mt-3 text-3xl font-semibold text-coral">
                  {latest.heartRate?.minimum ?? "—"}–{latest.heartRate?.maximum ?? "—"}
                  <span className="ml-1 text-sm font-normal text-muted">bpm</span>
                </p>
                <p className="mt-2 text-xs text-muted">Today’s minimum and maximum readings</p>
              </div>
              <div className="rounded-2xl border border-line bg-raised/80 p-5">
                <h3 className="font-semibold">Stress</h3>
                <p className="mt-3 text-sm text-muted">
                  Fit3 measures stress, but Samsung does not expose its stress score through
                  Health Connect or its current public Health Data SDK. It remains visible in
                  Samsung Health only.
                </p>
              </div>
            </div>
          </section>

          {latest.workouts?.length ? (
            <section className="mt-10">
              <p className="text-[12px] tracking-[0.18em] text-muted uppercase">Workouts</p>
              <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-raised/80">
                {latest.workouts.map((workout, index) => (
                  <div key={`${workout.startTime}-${index}`} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{workout.title || workout.type}</p>
                      <p className="mt-1 text-xs text-muted">{new Date(workout.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                    <span className="text-sm text-muted">{workout.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, hint, tone = "ink" }) {
  const tones = {
    teal: "text-teal",
    coral: "text-coral",
    cyan: "text-cyan",
    gold: "text-gold",
    ink: "text-ink",
  };
  return (
    <div className="rounded-2xl border border-line bg-raised/80 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
