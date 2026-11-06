// Small formatters for flight cards: times are the airport's local time.

// "2026-12-10T05:45" → "05:45".
export const clock = (localDateTime: string) => localDateTime.slice(11, 16);

// 135 → "2h 15m"; 45 → "45m".
export function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ""}` : `${rest}m`;
}

// Days after departure the flight lands: "+1" for the next day, "" for the same day.
export function dayShift(departAt: string, arriveAt: string) {
  const days = Math.round((Date.parse(arriveAt.slice(0, 10)) - Date.parse(departAt.slice(0, 10))) / 86_400_000);
  return days > 0 ? `+${days}` : "";
}

export const stopsLabel = (stops: number) => (stops === 0 ? "Non-stop" : stops === 1 ? "1 stop" : `${stops} stops`);
