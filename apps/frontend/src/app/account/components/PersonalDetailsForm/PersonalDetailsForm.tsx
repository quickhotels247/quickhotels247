"use client";

import { useMemo, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Gender, UpdateProfileRequest, User } from "@quickhotels/types/users";
import { accountApi } from "@/lib/api/auth";
import { countries } from "@/lib/countries";
import { useRequest } from "@/lib/hooks/useRequest";
import { styles } from "./PersonalDetailsForm.styles";

interface PersonalDetailsFormProps {
  user: User;
  token: string;
  onSaved: (user: User) => void;
}

const GENDERS: { value: Gender | ""; label: string }[] = [
  { value: "", label: "Prefer not to say" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

function fromUser(user: User) {
  const [code, ...rest] = (user.phone ?? "").split(" ");
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    phoneCode: user.phone ? code! : "+91",
    phone: rest.join(""),
    dateOfBirth: user.dateOfBirth ?? "",
    nationality: user.nationality ?? "",
    gender: (user.gender ?? "") as Gender | "",
    line1: user.address?.line1 ?? "",
    line2: user.address?.line2 ?? "",
    city: user.address?.city ?? "",
    state: user.address?.state ?? "",
    postcode: user.address?.postcode ?? "",
    country: user.address?.country ?? "IN",
  };
}
type Form = ReturnType<typeof fromUser>;

function toRequest(form: Form): UpdateProfileRequest {
  const phone = form.phone.replace(/[\s-]/g, "");
  const hasAddress = [form.line1, form.line2, form.city, form.state, form.postcode].some((value) => value.trim());
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phoneCode: phone ? form.phoneCode.trim() : "",
    phone,
    dateOfBirth: form.dateOfBirth || null,
    nationality: form.nationality || null,
    gender: form.gender || null,
    address: hasAddress
      ? { line1: form.line1.trim(), line2: form.line2.trim() || null, city: form.city.trim(), state: form.state.trim() || null, postcode: form.postcode.trim() || null, country: form.country }
      : null,
  };
}

// Personal details (Booking.com's "Personal details"): all but the name optional.
// Used to fill checkout forms.
export default function PersonalDetailsForm({ user, token, onSaved }: PersonalDetailsFormProps) {
  const [form, setForm] = useState(() => fromUser(user));
  const [saved, setSaved] = useState(false);
  const { busy, error, setError, run } = useRequest();
  const countryList = useMemo(() => countries(), []);
  const set = (changes: Partial<Form>) => {
    setForm((previous) => ({ ...previous, ...changes }));
    setSaved(false);
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = toRequest(form);
    if (request.address && (!request.address.line1 || !request.address.city))
      return setError("To save an address, fill in at least the address line and the town or city.");
    void run(async () => {
      const updated = await accountApi.updateProfile(token, request);
      onSaved(updated);
      setForm(fromUser(updated));
      setSaved(true);
    });
  }

  const countryOptions = countryList.map((country) => (
    <MenuItem key={country.code} value={country.code}>
      {country.name}
    </MenuItem>
  ));
  const menu = { select: { MenuProps: { slotProps: { paper: { sx: styles.menu } } } } };

  return (
    <Box component="form" onSubmit={submit} aria-labelledby="details-title" sx={styles.root} noValidate>
      <Typography component="h2" id="details-title" sx={styles.title}>
        Personal details
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">Your details are saved.</Alert>}

      <Box sx={styles.pair}>
        <TextField label="First name" required autoComplete="given-name" value={form.firstName} onChange={(event) => set({ firstName: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 50 } }} />
        <TextField label="Last name" required autoComplete="family-name" value={form.lastName} onChange={(event) => set({ lastName: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 50 } }} />
      </Box>
      <Box sx={styles.phone}>
        <TextField label="Code" autoComplete="tel-country-code" value={form.phoneCode} onChange={(event) => set({ phoneCode: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 5 } }} />
        <TextField label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={(event) => set({ phone: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 18 } }} />
      </Box>
      <Box sx={styles.three}>
        <TextField
          label="Date of birth"
          type="date"
          autoComplete="bday"
          value={form.dateOfBirth}
          onChange={(event) => set({ dateOfBirth: event.target.value })}
          disabled={busy}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().slice(0, 10), min: "1900-01-01" } }}
        />
        <TextField select label="Gender" value={form.gender} onChange={(event) => set({ gender: event.target.value as Gender | "" })} disabled={busy}>
          {GENDERS.map((gender) => (
            <MenuItem key={gender.label} value={gender.value}>
              {gender.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Nationality" value={form.nationality} onChange={(event) => set({ nationality: event.target.value })} disabled={busy} slotProps={menu}>
          <MenuItem value="">Not set</MenuItem>
          {countryOptions}
        </TextField>
      </Box>

      <Typography component="h3" sx={styles.section}>
        Address <Box component="span" sx={styles.optional}>(optional, for invoices)</Box>
      </Typography>
      <TextField label="Address line 1" autoComplete="address-line1" value={form.line1} onChange={(event) => set({ line1: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 120 } }} />
      <TextField label="Address line 2" autoComplete="address-line2" value={form.line2} onChange={(event) => set({ line2: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 120 } }} />
      <Box sx={styles.pair}>
        <TextField label="Town or city" autoComplete="address-level2" value={form.city} onChange={(event) => set({ city: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <TextField label="State" autoComplete="address-level1" value={form.state} onChange={(event) => set({ state: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 60 } }} />
      </Box>
      <Box sx={styles.pair}>
        <TextField label="PIN / postcode" autoComplete="postal-code" value={form.postcode} onChange={(event) => set({ postcode: event.target.value })} disabled={busy} slotProps={{ htmlInput: { maxLength: 10 } }} />
        <TextField select label="Country" value={form.country} onChange={(event) => set({ country: event.target.value })} disabled={busy} slotProps={menu}>
          {countryOptions}
        </TextField>
      </Box>

      <Button type="submit" variant="contained" disabled={busy} sx={styles.submit}>
        {busy ? "Saving…" : "Save details"}
      </Button>
    </Box>
  );
}
