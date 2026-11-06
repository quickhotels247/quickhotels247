import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { CheckoutGuest } from "@quickhotels/types/checkout";
import { ADULT_TITLES, CHILD_TITLES, fieldId, type FormErrors } from "../../../../utils/guestForm";
import { styles } from "./GuestRow.styles";

interface GuestRowProps {
  room: number;
  index: number;
  guest: CheckoutGuest;
  // Children's age, when this guest is a child.
  childAge: number | null;
  needsPan: boolean;
  needsPassport: boolean;
  errors: FormErrors;
  onChange: (guest: CheckoutGuest) => void;
  // "Fill from saved", for signed-in customers.
  action?: ReactNode;
}

export const guestLabel = (index: number, childAge: number | null) =>
  index === 0 ? "Main guest" : childAge !== null ? `Child (${childAge === 0 ? "under 1" : `${childAge} yrs`})` : `Guest ${index + 1}`;

// One guest: title, first and last name as on their ID, and PAN or passport
// when the rate asks for them.
export default function GuestRow({ room, index, guest, childAge, needsPan, needsPassport, errors, onChange, action }: GuestRowProps) {
  const set = (changes: Partial<CheckoutGuest>) => onChange({ ...guest, ...changes });
  const id = (field: string) => fieldId(room, index, field);
  const child = childAge !== null;
  return (
    <Box sx={styles.root}>
      <Box sx={styles.head}>
        <Typography sx={styles.label}>{guestLabel(index, childAge)}</Typography>
        {action}
      </Box>
      <Box sx={styles.grid}>
        <TextField select id={id("title")} label="Title" value={guest.title} onChange={(event) => set({ title: event.target.value as CheckoutGuest["title"] })} sx={styles.title}>
          {(child ? CHILD_TITLES : ADULT_TITLES).map((title) => (
            <MenuItem key={title} value={title}>
              {title}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id={id("first")}
          label="First name"
          autoComplete={index === 0 && room === 0 ? "given-name" : "off"}
          required
          value={guest.firstName}
          onChange={(event) => set({ firstName: event.target.value })}
          error={Boolean(errors[id("first")])}
          helperText={errors[id("first")]}
        />
        <TextField
          id={id("last")}
          label="Last name"
          autoComplete={index === 0 && room === 0 ? "family-name" : "off"}
          required
          value={guest.lastName}
          onChange={(event) => set({ lastName: event.target.value })}
          error={Boolean(errors[id("last")])}
          helperText={errors[id("last")]}
        />
        {needsPan && (
          <TextField
            id={id("pan")}
            label="PAN"
            required
            value={guest.pan ?? ""}
            onChange={(event) => set({ pan: event.target.value.toUpperCase() })}
            error={Boolean(errors[id("pan")])}
            helperText={errors[id("pan")] ?? "Needed by the hotel for this rate"}
            slotProps={{ htmlInput: { maxLength: 10, autoCapitalize: "characters" } }}
            sx={styles.wide}
          />
        )}
        {needsPassport && (
          <TextField
            id={id("passport")}
            label="Passport number"
            required
            value={guest.passportNumber ?? ""}
            onChange={(event) => set({ passportNumber: event.target.value.toUpperCase() })}
            error={Boolean(errors[id("passport")])}
            helperText={errors[id("passport")] ?? "Needed by the hotel for this rate"}
            slotProps={{ htmlInput: { maxLength: 12, autoCapitalize: "characters" } }}
            sx={styles.wide}
          />
        )}
      </Box>
    </Box>
  );
}
