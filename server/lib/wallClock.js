/** Turn a date + HH:mm wall clock into an absolute instant. */

export function parseWallClock({
  date,
  time,
  recordedAt,
  timezoneOffsetMinutes,
} = {}) {
  if (recordedAt) {
    const direct = new Date(recordedAt);
    if (!Number.isNaN(direct.getTime())) return direct;
  }

  if (!date || !time) return null;
  const day = String(date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const match = String(time).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const dateNum = Number(day.slice(8, 10));
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (![year, month, dateNum, hour, minute].every(Number.isFinite)) return null;
  if (hour > 23 || minute > 59) return null;

  const offset = Number(timezoneOffsetMinutes);
  if (Number.isFinite(offset)) {
    return new Date(
      Date.UTC(year, month - 1, dateNum, hour, minute, 0) + offset * 60 * 1000
    );
  }

  const local = new Date(year, month - 1, dateNum, hour, minute, 0);
  return Number.isNaN(local.getTime()) ? null : local;
}
