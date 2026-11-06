import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { FlightOption } from "@quickhotels/types/flights";
import SegmentList from "@/components/flight/SegmentList";
import { formatShortDate } from "@/lib/dates";
import { styles } from "./FlightDetails.styles";

// Every flight of the fare with its layovers, then baggage and fare type.
export default function FlightDetails({ option }: { option: FlightOption }) {
  return (
    <Box sx={styles.root}>
      {option.legs.map((leg, l) => (
        <Box key={l} sx={styles.leg}>
          {option.legs.length > 1 && (
            <Typography sx={styles.legTitle}>
              {l === 0 ? "Outbound" : option.legs.length === 2 ? "Return" : `Flight ${l + 1}`} · {leg.from} → {leg.to} · {formatShortDate(leg.departAt.slice(0, 10))}
            </Typography>
          )}
          <SegmentList journey={leg} />
        </Box>
      ))}
      <Box sx={styles.facts}>
        <Typography sx={styles.fact}>
          Baggage: {option.baggage.checkIn ? `${option.baggage.checkIn} check-in` : "check-in not included"}
          {option.baggage.cabin ? `, ${option.baggage.cabin} cabin` : ""}
        </Typography>
        <Typography sx={styles.fact}>Fare: {option.fareType.replace(/_/g, " ").toLowerCase()} · {option.cabin.toLowerCase().replace(/_/g, " ")}</Typography>
        <Typography sx={styles.note}>Change and cancellation rules are shown before you pay.</Typography>
      </Box>
    </Box>
  );
}
