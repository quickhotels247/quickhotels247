import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { FlightJourney } from "@quickhotels/types/flights";
import AirlineBadge from "@/components/flight/AirlineBadge";
import { clock, dayShift, duration, stopsLabel } from "@/lib/flightFormat";
import { styles } from "./JourneyRow.styles";

// One direction: airline, departure, a line with duration and stops, arrival.
export default function JourneyRow({ journey }: { journey: FlightJourney }) {
  const first = journey.segments[0];
  const airlines = [...new Set(journey.segments.map((segment) => segment.airlineName))].join(", ");
  const via = journey.segments.slice(0, -1).map((segment) => segment.to);
  const shift = dayShift(journey.departAt, journey.arriveAt);
  return (
    <Box sx={styles.root}>
      <Box sx={styles.airline}>
        {first && <AirlineBadge code={first.airlineCode} name={first.airlineName} />}
        <Box sx={styles.airlineText}>
          <Typography sx={styles.airlineName}>{airlines}</Typography>
          <Typography sx={styles.flightNo}>{journey.segments.map((segment) => segment.flightNumber).join(" · ")}</Typography>
        </Box>
      </Box>
      <Box sx={styles.point}>
        <Typography sx={styles.time}>{clock(journey.departAt)}</Typography>
        <Typography sx={styles.code}>{journey.from}</Typography>
      </Box>
      <Box sx={styles.middle}>
        <Typography sx={styles.duration}>{duration(journey.durationMins)}</Typography>
        <Box sx={styles.line} aria-hidden="true">
          {via.map((code) => (
            <Box key={code} sx={styles.stopDot} />
          ))}
        </Box>
        <Typography sx={[styles.stops, journey.stops === 0 && styles.direct]}>
          {stopsLabel(journey.stops)}
          {via.length ? ` · ${via.join(", ")}` : ""}
        </Typography>
      </Box>
      <Box sx={[styles.point, styles.arrive]}>
        <Typography sx={styles.time}>
          {clock(journey.arriveAt)}
          {shift && (
            <Box component="sup" sx={styles.shift} title="Arrives the next day">
              {shift}
            </Box>
          )}
        </Typography>
        <Typography sx={styles.code}>{journey.to}</Typography>
      </Box>
    </Box>
  );
}
