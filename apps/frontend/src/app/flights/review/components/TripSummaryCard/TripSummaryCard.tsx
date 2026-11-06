import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FlightTakeoffRounded from "@mui/icons-material/FlightTakeoffRounded";
import type { FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import { formatDayDate } from "@/lib/dates";
import { clock, duration, stopsLabel } from "@/lib/flightFormat";
import { styles } from "./TripSummaryCard.styles";

// The trip in brief, beside the travellers and payment steps.
export default function TripSummaryCard({ review }: { review: FlightReviewSummary }) {
  return (
    <Box component="section" aria-labelledby="trip-summary-title" sx={styles.root}>
      <Typography component="h2" id="trip-summary-title" sx={styles.title}>
        Your flights
      </Typography>
      {review.journeys.map((journey, i) => (
        <Box key={i} sx={styles.journey}>
          <FlightTakeoffRounded sx={styles.icon} aria-hidden="true" />
          <Box>
            <Typography sx={styles.route}>
              {journey.from} → {journey.to} · {formatDayDate(journey.departAt.slice(0, 10))}
            </Typography>
            <Typography sx={styles.meta}>
              {clock(journey.departAt)}–{clock(journey.arriveAt)} · {duration(journey.durationMins)} · {stopsLabel(journey.stops)} ·{" "}
              {[...new Set(journey.segments.map((segment) => segment.airlineName))].join(", ")}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
