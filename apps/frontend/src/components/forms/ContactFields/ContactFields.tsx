import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styles } from "./ContactFields.styles";

export interface ContactValue {
  email: string;
  phoneCode: string;
  phone: string;
}

interface ContactFieldsProps {
  value: ContactValue;
  onChange: (value: ContactValue) => void;
  errors?: Partial<Record<keyof ContactValue, string>>;
  // Element ids, so an error summary can link to the fields.
  ids: Record<keyof ContactValue, string>;
  hint?: string;
}

// Email, country code and mobile number, for confirmations and updates.
export default function ContactFields({ value, onChange, errors = {}, ids, hint }: ContactFieldsProps) {
  const set = (changes: Partial<ContactValue>) => onChange({ ...value, ...changes });
  return (
    <Box>
      {hint && <Typography sx={styles.hint}>{hint}</Typography>}
      <Box sx={styles.grid}>
        <TextField
          id={ids.email}
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={value.email}
          onChange={(event) => set({ email: event.target.value })}
          error={Boolean(errors.email)}
          helperText={errors.email}
          sx={styles.email}
        />
        <TextField
          id={ids.phoneCode}
          label="Code"
          autoComplete="tel-country-code"
          required
          value={value.phoneCode}
          onChange={(event) => set({ phoneCode: event.target.value })}
          error={Boolean(errors.phoneCode)}
        />
        <TextField
          id={ids.phone}
          label="Mobile number"
          type="tel"
          autoComplete="tel-national"
          inputMode="numeric"
          required
          value={value.phone}
          onChange={(event) => set({ phone: event.target.value })}
          error={Boolean(errors.phone || errors.phoneCode)}
          helperText={errors.phone ?? errors.phoneCode}
        />
      </Box>
    </Box>
  );
}
