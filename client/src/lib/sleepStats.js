/** Sleep cycle length in minutes (research average ~90 min, range 70–110). */
export const CYCLE_MINUTES = 90;

export const SLEEP_GUIDE = {
  cycleMinutes: CYCLE_MINUTES,
  optimalHoursMin: 7,
  optimalHoursMax: 9,
  recommendedCyclesMin: 4,
  recommendedCyclesMax: 6,
};

function durationScore(minutes) {
  const hours = minutes / 60;
  if (hours < 5) return 30;
  if (hours < 6) return 50;
  if (hours < 7) return 70;
  if (hours <= 9) return 100;
  if (hours <= 10) return 80;
  return 60;
}

function cycleScore(minutes) {
  const nearestCycles = Math.round(minutes / CYCLE_MINUTES);
  const ideal = Math.max(1, nearestCycles) * CYCLE_MINUTES;
  const deviation = Math.abs(minutes - ideal);
  return Math.max(0, Math.round(100 - deviation * 2));
}

export function analyzeSleep(log) {
  const minutes = Number(log?.durationMinutes) || 0;
  const cycles = minutes / CYCLE_MINUTES;
  const fullCycles = Math.round(cycles);
  const durScore = durationScore(minutes);
  const cycScore = cycleScore(minutes);
  const subjective =
    log?.quality != null ? Math.round(Number(log.quality) * 10) : null;

  let overall;
  if (subjective != null) {
    overall = Math.round(durScore * 0.35 + cycScore * 0.3 + subjective * 0.35);
  } else {
    overall = Math.round(durScore * 0.55 + cycScore * 0.45);
  }

  let label = "Poor";
  let color = "#ff6b6b";
  if (overall >= 85) {
    label = "Excellent";
    color = "#3ce6d4";
  } else if (overall >= 70) {
    label = "Good";
    color = "#b9a6ff";
  } else if (overall >= 55) {
    label = "Fair";
    color = "#e8c36a";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const durationLabel =
    hours > 0
      ? mins > 0
        ? `${hours}h ${mins}m`
        : `${hours}h`
      : `${mins}m`;

  let durationHint = "Below recommended 7–9 hours";
  if (minutes / 60 >= 7 && minutes / 60 <= 9) {
    durationHint = "Within the 7–9 hour sweet spot";
  } else if (minutes / 60 >= 6 && minutes / 60 < 7) {
    durationHint = "Slightly short — aim for 7+ hours";
  } else if (minutes / 60 > 9) {
    durationHint = "Longer than typical — fine if you feel rested";
  }

  const cycleHint =
    fullCycles >= 4 && fullCycles <= 6
      ? `~${fullCycles} full cycles — ideal range`
      : fullCycles < 4
        ? `~${fullCycles} cycles — adults usually need 4–6`
        : `~${fullCycles} cycles — more than typical`;

  return {
    overall,
    label,
    color,
    durationScore: durScore,
    cycleScore: cycScore,
    subjectiveScore: subjective,
    cycles: Math.round(cycles * 10) / 10,
    fullCycles,
    durationLabel,
    durationHint,
    cycleHint,
  };
}

export function formatMinutes(minutes) {
  const m = Number(minutes) || 0;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h ${r}m`;
  if (h > 0) return `${h}h`;
  return `${r}m`;
}

export function avg(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

export function statsFromLogs(logs) {
  const enriched = logs.map((log) => ({
    ...log,
    analysis: log.analysis || analyzeSleep(log),
  }));

  const last7 = enriched.slice(0, 7);
  const durations = last7.map((l) => l.durationMinutes);
  const scores = last7.map((l) => l.analysis.overall);
  const latest = enriched[0] || null;

  const goodNights = last7.filter((l) => l.analysis.overall >= 70).length;

  return {
    count: enriched.length,
    latest,
    lastNight: latest,
    weekAvgMinutes: avg(durations),
    weekAvgScore: avg(scores),
    goodNights,
    logs: enriched,
  };
}
