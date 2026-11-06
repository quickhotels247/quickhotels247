import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRounded from "@mui/icons-material/CloseRounded";
import FlightLandRounded from "@mui/icons-material/FlightLandRounded";
import FlightTakeoffRounded from "@mui/icons-material/FlightTakeoffRounded";
import type { FlightLeg } from "@quickhotels/types/flights";
import AirportField from "../../AirportField";
import FlightDatesField from "../../FlightDatesField";
import SwapAirportsButton from "../../SwapAirportsButton";
import { styles } from "./MultiCityLegRow.styles";

interface MultiCityLegRowProps {
  index: number;
  leg: FlightLeg;
  minDate?: string;
  onChange: (changes: Partial<FlightLeg>) => void;
  // Missing while only two flights are left.
  onRemove?: () => void;
  invalidRoute: boolean;
  invalidDate: boolean;
}

export default function MultiCityLegRow({ index, leg, minDate, onChange, onRemove, invalidRoute, invalidDate }: MultiCityLegRowProps) {
  return (
    <Box role="group" aria-label={`Flight ${index + 1}`} sx={styles.root}>
      <Typography sx={styles.number}>Flight {index + 1}</Typography>
      <Box sx={styles.fields}>
        <AirportField label="Leaving from" icon={<FlightTakeoffRounded />} value={leg.from} onChange={(from) => onChange({ from })} invalid={invalidRoute} />
        <SwapAirportsButton onSwap={() => onChange({ from: leg.to, to: leg.from })} />
        <AirportField label="Going to" icon={<FlightLandRounded />} value={leg.to} onChange={(to) => onChange({ to })} invalid={invalidRoute} />
        <FlightDatesField
          tripType="oneWay"
          depart={leg.depart}
          returnDate=""
          minDate={minDate}
          label="Departure date"
          onChange={(depart) => onChange({ depart })}
          invalid={invalidDate}
        />
        <Box sx={styles.removeCell}>
          {onRemove && (
            <IconButton onClick={onRemove} aria-label={`Remove flight ${index + 1}`} sx={styles.remove}>
              <CloseRounded />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}
