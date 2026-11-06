import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { CabinClass } from "@quickhotels/types/flights";
import { cabinLabels } from "../flightSearchCriteria";
import { styles } from "./CabinClassSelect.styles";

interface CabinClassSelectProps {
  value: CabinClass;
  onChange: (value: CabinClass) => void;
}

export default function CabinClassSelect({ value, onChange }: CabinClassSelectProps) {
  return (
    <Select
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value as CabinClass)}
      inputProps={{ "aria-label": "Cabin class" }}
      sx={styles.select}
    >
      {(Object.keys(cabinLabels) as CabinClass[]).map((cabin) => (
        <MenuItem key={cabin} value={cabin}>
          {cabinLabels[cabin]}
        </MenuItem>
      ))}
    </Select>
  );
}
