import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { toIso } from "@/lib/dates";
import DayCell from "./DayCell";
import { styles } from "./MonthGrid.styles";

interface MonthGridProps {
  month: string; // "YYYY-MM"
  start: string;
  end: string;
  minDate: string;
  onPick: (day: string) => void;
  onHover: (day: string | null) => void;
  prices?: Record<string, { label: string; cheapest: boolean }>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// One month: its name, the weekday row, and a week-by-week grid of days.
export default function MonthGrid({ month, start, end, minDate, onPick, onHover, prices }: MonthGridProps) {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(year, monthIndex - 1, 1);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const title = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // Blank cells before the 1st so it lands under its weekday.
  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(year, monthIndex - 1, i + 1))),
  ];

  return (
    <Box>
      <Typography sx={styles.title}>{title}</Typography>
      <Box role="grid" aria-label={title} sx={styles.grid}>
        {WEEKDAYS.map((weekday) => (
          <Typography key={weekday} role="columnheader" sx={styles.weekday}>
            {weekday}
          </Typography>
        ))}
        {cells.map((day, index) =>
          day ? (
            <DayCell
              key={day}
              day={day}
              disabled={day < minDate}
              isStart={day === start}
              isEnd={day === end}
              inRange={Boolean(start && end && day > start && day < end)}
              onPick={onPick}
              onHover={onHover}
              withPrices={Boolean(prices)}
              price={prices?.[day] ?? null}
            />
          ) : (
            <Box key={`blank-${index}`} aria-hidden="true" />
          ),
        )}
      </Box>
    </Box>
  );
}
