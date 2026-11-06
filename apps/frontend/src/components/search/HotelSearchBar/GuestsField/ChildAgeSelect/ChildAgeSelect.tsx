import { useId } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { AGE_NOT_SET, GUEST_LIMITS } from "../../searchCriteria";
import { styles } from "./ChildAgeSelect.styles";

interface ChildAgeSelectProps {
  // 1-based, for the label ("Child 2 age").
  number: number;
  age: number;
  // Highlights an unset age once the visitor has tried to search.
  invalid: boolean;
  onChange: (age: number) => void;
}

const { min, max } = GUEST_LIMITS.childAge;
const ages = Array.from({ length: max - min + 1 }, (_, i) => min + i);
const ageLabel = (age: number) => (age === 0 ? "Under 1" : `${age} year${age === 1 ? "" : "s"} old`);

// "Child 1 age" dropdown: hotels price rooms by each child's age at check-in.
export default function ChildAgeSelect({ number, age, invalid, onChange }: ChildAgeSelectProps) {
  const labelId = useId();
  const unset = age === AGE_NOT_SET;
  return (
    <FormControl size="small" fullWidth error={invalid && unset} sx={styles.root}>
      <InputLabel id={labelId}>{`Child ${number} age`}</InputLabel>
      <Select
        labelId={labelId}
        label={`Child ${number} age`}
        value={unset ? "" : String(age)}
        onChange={(event) => onChange(Number(event.target.value))}
        MenuProps={{ slotProps: { paper: { sx: styles.menu } } }}
      >
        {ages.map((value) => (
          <MenuItem key={value} value={String(value)}>
            {ageLabel(value)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
