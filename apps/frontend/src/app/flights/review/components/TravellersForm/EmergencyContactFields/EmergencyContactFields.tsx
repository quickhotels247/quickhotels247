import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import type { FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import { fieldId, type FormErrors } from "../../../utils/travellerForm";
import { styles } from "./EmergencyContactFields.styles";

type Emergency = NonNullable<FlightTravellerDetails["emergencyContact"]>;

interface EmergencyContactFieldsProps {
  value: Emergency | undefined;
  errors: FormErrors;
  onChange: (contact: Emergency) => void;
}

// Someone not travelling whom the airline can reach, when the fare asks.
export default function EmergencyContactFields({ value, errors, onChange }: EmergencyContactFieldsProps) {
  const contact: Emergency = value ?? { name: "", phoneCode: "+91", phone: "" };
  const set = (changes: Partial<Emergency>) => onChange({ ...contact, ...changes });
  return (
    <Box sx={styles.grid}>
      <TextField
        id={fieldId("emergency-name")}
        label="Name"
        required
        value={contact.name}
        onChange={(event) => set({ name: event.target.value })}
        error={Boolean(errors[fieldId("emergency-name")])}
        helperText={errors[fieldId("emergency-name")]}
      />
      <TextField label="Code" required value={contact.phoneCode} onChange={(event) => set({ phoneCode: event.target.value })} />
      <TextField
        id={fieldId("emergency-phone")}
        label="Mobile number"
        type="tel"
        required
        value={contact.phone}
        onChange={(event) => set({ phone: event.target.value })}
        error={Boolean(errors[fieldId("emergency-phone")])}
        helperText={errors[fieldId("emergency-phone")]}
      />
    </Box>
  );
}
