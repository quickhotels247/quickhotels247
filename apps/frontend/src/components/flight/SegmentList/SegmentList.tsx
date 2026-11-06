import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FlightTakeoffRounded from "@mui/icons-material/FlightTakeoffRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import type { FlightJourney } from "@quickhotels/types/flights";
import { formatShortDate } from "@/lib/dates";
import { clock, duration } from "@/lib/flightFormat";
import { styles } from "./SegmentList.styles";

// Local times at the same airport, so plain subtraction is right.
const minutesBetween = (from: string, to: string) => Math.round((Date.parse(`${to}:00Z`) - Date.parse(`${from}:00Z`)) / 60_000);

// Every flight of a journey with its times, and the layovers in between
// (with a warning when the next flight leaves from another airport).
export default function SegmentList({ journey }: { journey: FlightJourney }) {
  return (
    <Box sx={styles.root}>
      {journey.segments.map((segment, s) => {
        const next = journey.segments[s + 1];
        return (
          <Box key={s}>
            <Box sx={styles.segment}>
              <FlightTakeoffRounded sx={styles.icon} aria-hidden="true" />
              <Box>
                <Typography sx={styles.title}>
                  {segment.airlineName} · {segment.flightNumber}
                </Typography>
                <Typography sx={styles.text}>
                  {formatShortDate(segment.departAt.slice(0, 10))} {clock(segment.departAt)} {segment.from} → {clock(segment.arriveAt)} {segment.to} ·{" "}
                  {duration(segment.durationMins)}
                </Typography>
              </Box>
            </Box>
            {next && (
              <Typography sx={styles.layover}>
                <ScheduleRounded sx={styles.layoverIcon} aria-hidden="true" />
                {duration(minutesBetween(segment.arriveAt, next.departAt))} layover in {segment.to}
                {segment.to !== next.from ? ` (change to ${next.from})` : ""}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
