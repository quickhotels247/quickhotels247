import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { FlightOption, FlightTripSummary } from "@quickhotels/types/flights";
import { formatPrice } from "@/lib/format";
import { clock } from "@/lib/flightFormat";
import { styles } from "./SelectionBar.styles";

interface SelectionBarProps {
  trips: FlightTripSummary[];
  picks: Record<string, FlightOption>;
  onContinue: () => void;
  // The picks don't fit together (e.g. return before the outbound lands).
  blocked?: boolean;
}

// Sticky at the bottom while choosing each direction: what's picked so far,
// the total, and Continue once every direction has a flight.
export default function SelectionBar({ trips, picks, onContinue, blocked = false }: SelectionBarProps) {
  const chosen = trips.map((trip) => picks[trip.key]);
  const complete = chosen.every(Boolean);
  const total = chosen.reduce((sum, option) => sum + (option?.price.amount ?? 0), 0);
  const currency = chosen.find(Boolean)?.price.currency ?? "INR";
  return (
    <Box sx={styles.root} role="region" aria-label="Your flights">
      <Container sx={styles.inner}>
        <Box sx={styles.picks}>
          {trips.map((trip, i) => {
            const option = picks[trip.key];
            const leg = option?.legs[0];
            return (
              <Box key={trip.key} sx={styles.pick}>
                <Typography sx={styles.pickLabel}>{trip.label}</Typography>
                <Typography sx={styles.pickValue}>
                  {leg ? `${option.airlines} · ${clock(leg.departAt)}–${clock(leg.arriveAt)}` : `Choose flight ${i + 1}`}
                </Typography>
              </Box>
            );
          })}
        </Box>
        <Box sx={styles.action}>
          {total > 0 && (
            <Box sx={styles.totalBox}>
              <Typography sx={styles.totalLabel}>{complete ? "Total" : "So far"}</Typography>
              <Typography sx={styles.total}>{formatPrice({ amount: total, currency })}</Typography>
            </Box>
          )}
          <Button variant="contained" size="large" disabled={!complete || blocked} onClick={onContinue}>
            Continue
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
