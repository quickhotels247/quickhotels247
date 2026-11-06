import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import LuggageOutlined from "@mui/icons-material/LuggageOutlined";
import type { FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import JourneyRow from "@/components/flight/JourneyRow";
import SegmentList from "@/components/flight/SegmentList";
import { formatDayDate } from "@/lib/dates";
import { styles } from "./ItineraryCard.styles";

const REFUND = { REFUNDABLE: "Refundable", PARTIALLY_REFUNDABLE: "Partly refundable", NON_REFUNDABLE: "Non-refundable" } as const;
const title = (index: number, count: number) => (count === 1 ? "Your flight" : count === 2 ? (index === 0 ? "Departure" : "Return") : `Flight ${index + 1}`);
const words = (value: string) => value.replace(/_/g, " ").toLowerCase();
// "OFFER_FARE_WITH_PNR" → "offer fare with pnr"; "PUBLISHED" → "published fare".
const fareName = (value: string) => (/fare/i.test(value) ? words(value) : `${words(value)} fare`);

// Every journey with its flights and layovers, then what each fare includes.
export default function ItineraryCard({ review }: { review: FlightReviewSummary }) {
  return (
    <Box component="section" aria-labelledby="itinerary-title" sx={styles.root}>
      <Typography component="h2" id="itinerary-title" sx={styles.heading}>
        Your trip
      </Typography>
      {review.journeys.map((journey, i) => (
        <Box key={i} sx={styles.journey}>
          <Typography sx={styles.journeyTitle}>
            {title(i, review.journeys.length)} · {formatDayDate(journey.departAt.slice(0, 10))}
          </Typography>
          <JourneyRow journey={journey} />
          <Box sx={styles.segments}>
            <SegmentList journey={journey} />
          </Box>
        </Box>
      ))}
      <Divider />
      <Box sx={styles.fares}>
        {review.fares.map((fare) => (
          <Box key={fare.trip} sx={styles.fare}>
            {review.fares.length > 1 && <Typography sx={styles.fareLabel}>{fare.label}</Typography>}
            <Box sx={styles.chips}>
              {fare.baggage.checkIn && <Chip icon={<LuggageOutlined />} label={`${fare.baggage.checkIn} check-in`} size="small" variant="outlined" />}
              {fare.baggage.cabin && <Chip label={`${fare.baggage.cabin} cabin`} size="small" variant="outlined" />}
              <Chip label={REFUND[fare.refundable]} size="small" variant="outlined" color={fare.refundable === "NON_REFUNDABLE" ? "default" : "success"} />
              <Chip label={`${words(fare.cabin)} · ${fareName(fare.fareType)}`} size="small" variant="outlined" sx={styles.capital} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
