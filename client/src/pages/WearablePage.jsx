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

function localDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fillDays(records, count = 40) {
  const byDay = new Map(records.map((record) => [record.day, record]));
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const day = localDay(date);
    return byDay.get(day) || { day, dataAvailable: false };
  });
}

export default function WearablePage() {
  const cached = peekWearableData(40);
  const [syncedRecords, setSyncedRecords] = useState(() => cached?.records || []);
  const [error, setError] = useState("");

  useEffect(() => {
    getWearableData(40)
      .then((data) => {
        setSyncedRecords(data.records || []);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, []);

  const records = useMemo(() => fillDays(syncedRecords, 40), [syncedRecords]);
  const today = records[0];
  const latest = syncedRecords[0];
  const stepMax = useMemo(
    () => Math.max(10000, ...syncedRecords.map((item) => item.steps || 0)),
    [syncedRecords]
  );

  return (
    <div className="page-pad">
      <p className="text-[12px] tracking-[0.18em] text-coral uppercase">My Health</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Step</h2>
          <p className="mt-2 text-sm text-muted">
            Precise steps and heart-rate readings synced from Galaxy Fit3 through Health Connect.
          </p>
        </div>
        <p className="rounded-full border border-line bg-raised px-3 py-1.5 text-xs text-muted">
          {dayLabel(latest?.day)}
        </p>
      </div>
      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

      {!latest ? (
        <div className="mt-8 rounded-2xl border border-line bg-raised/80 p-6">
          <h3 className="font-semibold">No step data has been synced</h3>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Open BetterMe Health on your Android phone, grant the requested Health Connect
            permissions, then tap Sync to BetterMe.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <p className="text-[12px] tracking-[0.18em] text-muted uppercase">Today · {today.day}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Steps" value={today.steps == null ? "Data not available" : valueOrDash(today.steps)} hint="Fit3 daily total" tone="teal" compact={today.steps == null} />
              <Metric label="Heart rate" value={today.heartRate?.latest == null ? "Data not available" : valueOrDash(today.heartRate.latest, " bpm")} hint={today.heartRate?.average ? `Average ${today.heartRate.average} bpm` : "No reading today"} tone="coral" compact={today.heartRate?.latest == null} />
              <Metric label="Resting heart rate" value={today.heartRate?.resting == null ? "Data not available" : valueOrDash(today.heartRate.resting, " bpm")} hint="Supplied by Samsung Health" compact={today.heartRate?.resting == null} />
              <Metric label="Distance" value={today.distanceMeters == null ? "Data not available" : km(today.distanceMeters)} hint="Walking distance" compact={today.distanceMeters == null} />
            </div>
          </section>

          <section className="mt-10 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-line bg-raised/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Steps · last 40 days</h3>
                <span className="text-xs text-muted">Goal line: 10,000</span>
              </div>
              <div className="mt-5 space-y-3">
                {records.map((record) => (
                  <div key={record.day} className="grid grid-cols-[68px_1fr_112px] items-center gap-3 text-xs">
                    <span className="text-muted">{record.day.slice(5)}</span>
                    <div className="relative h-2.5 overflow-hidden rounded-full bg-inset">
                      {record.steps != null ? <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, (record.steps / stepMax) * 100)}%` }} /> : null}
                      <span className="absolute inset-y-0 w-px bg-gold/80" style={{ left: `${Math.min(100, (10000 / stepMax) * 100)}%` }} />
                    </div>
                    <span className={`text-right ${record.steps == null ? "text-muted" : "text-ink"}`}>
                      {record.steps == null ? "Data not available" : valueOrDash(record.steps)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-raised/80 p-5">
                <h3 className="font-semibold">Heart range</h3>
                <p className="mt-3 text-3xl font-semibold text-coral">
                  {today.heartRate?.minimum ?? "—"}–{today.heartRate?.maximum ?? "—"}
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

        </>
      )}
    </div>
  );
}

function Metric({ label, value, hint, tone = "ink", compact = false }) {
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
      <p className={`mt-2 font-semibold ${compact ? "text-base" : "text-2xl"} ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
