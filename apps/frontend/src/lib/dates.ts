// Calendar dates as YYYY-MM-DD strings in the visitor's own time zone, for
// stay and travel dates (they're days, not moments, so no UTC shift).

export function toIso(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso() {
  return toIso(new Date());
}

// The day after a YYYY-MM-DD date.
export function nextDay(iso: string) {
  return addDaysIso(iso, 1);
}

// A YYYY-MM-DD date `days` later (negative goes back).
export function addDaysIso(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  return toIso(new Date(year, month - 1, day + days));
}

// "25 Apr" from YYYY-MM-DD.
export function formatShortDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// The YYYY-MM-DD date as a local Date at midnight.
export function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "YYYY-MM" for the month a YYYY-MM-DD date falls in.
export const monthOf = (iso: string) => iso.slice(0, 7);

// The month `count` months after a "YYYY-MM" month (negative goes back).
export function addMonths(month: string, count: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + count, 1);
  return toIso(date).slice(0, 7);
}

// Whole nights between two YYYY-MM-DD dates.
export function nightsBetween(start: string, end: string) {
  return Math.round((parseIso(end).getTime() - parseIso(start).getTime()) / 86_400_000);
}

// "Sat, 5 Dec" from YYYY-MM-DD.
export function formatDayDate(iso: string) {
  return parseIso(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// "14:00" → "2:00 PM".
export function formatClock(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}
