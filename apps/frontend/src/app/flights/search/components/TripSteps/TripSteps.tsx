import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import type { FlightTripSummary } from "@quickhotels/types/flights";
import { styles } from "./TripSteps.styles";

interface TripStepsProps {
  trips: FlightTripSummary[];
  current: string;
  // Lists with a flight already picked.
  picked: string[];
  onChoose: (key: string) => void;
}

// "1 Outbound · DEL → GOI  2 Return · GOI → DEL": when each direction is
// chosen separately (domestic returns, multi-city), one step per list.
export default function TripSteps({ trips, current, picked, onChoose }: TripStepsProps) {
  return (
    <Box role="tablist" aria-label="Choose each flight" sx={styles.root}>
      {trips.map((trip, i) => {
        const done = picked.includes(trip.key);
        return (
          <ButtonBase key={trip.key} role="tab" aria-selected={trip.key === current} onClick={() => onChoose(trip.key)} sx={[styles.step, trip.key === current && styles.active]}>
            <Box sx={[styles.number, done && styles.done]} aria-hidden="true">
              {done ? <CheckCircleRounded fontSize="small" /> : i + 1}
            </Box>
            <Box sx={styles.text}>
              <Typography sx={styles.label}>{trip.label}</Typography>
              <Typography sx={styles.meta}>{done ? "Flight chosen" : `${trip.total} options`}</Typography>
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
