import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import type { FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import { fieldId, type FormErrors } from "../../../utils/travellerForm";
import { styles } from "./GstFields.styles";

type Gst = NonNullable<FlightTravellerDetails["gst"]>;

interface GstFieldsProps {
  value: Gst | undefined;
  errors: FormErrors;
  onChange: (gst: Gst) => void;
}

// GST number and company (for a GST invoice), with optional contact and address.
export default function GstFields({ value, errors, onChange }: GstFieldsProps) {
  const gst: Gst = value ?? { number: "", companyName: "" };
  const set = (changes: Partial<Gst>) => onChange({ ...gst, ...changes });
  const error = (field: string) => ({ error: Boolean(errors[fieldId(field)]), helperText: errors[fieldId(field)] });
  return (
    <Box sx={styles.grid}>
      <TextField id={fieldId("gst-number")} label="GST number" required value={gst.number} onChange={(event) => set({ number: event.target.value.toUpperCase() })} slotProps={{ htmlInput: { maxLength: 15 } }} {...error("gst-number")} />
      <TextField id={fieldId("gst-name")} label="Registered company name" required value={gst.companyName} onChange={(event) => set({ companyName: event.target.value })} slotProps={{ htmlInput: { maxLength: 35 } }} {...error("gst-name")} />
      <TextField label="Company email (optional)" type="email" value={gst.email ?? ""} onChange={(event) => set({ email: event.target.value || undefined })} />
      <TextField label="Company address (optional)" value={gst.address ?? ""} onChange={(event) => set({ address: event.target.value || undefined })} slotProps={{ htmlInput: { maxLength: 70 } }} />
    </Box>
  );
}
