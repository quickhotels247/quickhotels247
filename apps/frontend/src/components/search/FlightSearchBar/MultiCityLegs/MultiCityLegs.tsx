import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddRounded from "@mui/icons-material/AddRounded";
import type { FlightLeg } from "@quickhotels/types/flights";
import { MAX_LEGS, emptyLeg } from "../flightSearchCriteria";
import MultiCityLegRow from "./MultiCityLegRow";
import { styles } from "./MultiCityLegs.styles";

interface MultiCityLegsProps {
  legs: FlightLeg[];
  onChange: (legs: FlightLeg[]) => void;
  invalidRoute: boolean;
  invalidDates: boolean;
}

// Two to five flights, each with From, To and a date.
export default function MultiCityLegs({ legs, onChange, invalidRoute, invalidDates }: MultiCityLegsProps) {
  // Picking where a flight lands also fills where the next one leaves from,
  // if that's still empty.
  const updateLeg = (index: number, changes: Partial<FlightLeg>) =>
    onChange(
      legs.map((leg, i) => {
        if (i === index) return { ...leg, ...changes };
        if (i === index + 1 && changes.to && !leg.from) return { ...leg, from: changes.to };
        return leg;
      }),
    );

  // A new flight starts where the last one landed.
  const addLeg = () => onChange([...legs, { ...emptyLeg, from: legs[legs.length - 1]?.to ?? "" }]);

  return (
    <Box sx={styles.root}>
      {legs.map((leg, index) => (
        <MultiCityLegRow
          key={index}
          index={index}
          leg={leg}
          minDate={legs[index - 1]?.depart}
          onChange={(changes) => updateLeg(index, changes)}
          onRemove={legs.length > 2 ? () => onChange(legs.filter((_, i) => i !== index)) : undefined}
          invalidRoute={invalidRoute}
          invalidDate={invalidDates}
        />
      ))}
      {legs.length < MAX_LEGS && (
        <Button startIcon={<AddRounded />} onClick={addLeg} sx={styles.add}>
          Add a flight
        </Button>
      )}
    </Box>
  );
}
