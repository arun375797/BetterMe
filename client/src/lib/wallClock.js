/** Date + HH:mm as the user's clock, encoded as UTC ISO. */

export function wallClockIso(date, time) {
  const day = String(date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const match = String(time || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";

  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const dateNum = Number(day.slice(8, 10));
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const local = new Date(year, month - 1, dateNum, hour, minute, 0, 0);
  if (Number.isNaN(local.getTime())) return "";
  return local.toISOString();
}

export function wallClockPayload(date, time) {
  return {
    date,
    time,
    recordedAt: wallClockIso(date, time) || undefined,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
  };
}
