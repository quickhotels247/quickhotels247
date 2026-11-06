import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { TripType } from "@quickhotels/types/flights";
import { styles } from "./TripTypeTabs.styles";

interface TripTypeTabsProps {
  value: TripType;
  onChange: (value: TripType) => void;
}

// Round-trip / One-way / Multi-city.
export default function TripTypeTabs({ value, onChange }: TripTypeTabsProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, next: TripType | null) => next && onChange(next)}
      aria-label="Trip type"
      sx={styles.group}
    >
      <ToggleButton value="roundTrip" sx={styles.button}>
        Round-trip
      </ToggleButton>
      <ToggleButton value="oneWay" sx={styles.button}>
        One-way
      </ToggleButton>
      <ToggleButton value="multiCity" sx={styles.button}>
        Multi-city
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
