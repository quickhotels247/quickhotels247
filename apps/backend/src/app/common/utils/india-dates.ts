// Calendar dates as YYYY-MM-DD in India (Asia/Kolkata), for "this weekend"
// and "in two weeks" style defaults, whatever time zone the server runs in.
const IST = "Asia/Kolkata";

export function todayInIndia(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// The coming Friday to Sunday. On a Friday that's today; on a Saturday or
// Sunday it's next weekend, since this one is already under way.
export function upcomingWeekendInIndia(now = new Date()) {
  const today = todayInIndia(now);
  const day = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 Sunday … 6 Saturday
  const toFriday = day === 6 ? 6 : day === 0 ? 5 : 5 - day;
  const checkIn = addDays(today, toFriday);
  return { checkIn, checkOut: addDays(checkIn, 2) };
}
