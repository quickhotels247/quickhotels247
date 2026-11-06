"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { CheckoutGuestDetails, CheckoutSummary } from "@quickhotels/types/checkout";
import { routes } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { travellerKey, useSavedTravellers } from "@/lib/hooks/useSavedTravellers";
import { formatPrice } from "@/lib/format";
import { cleanDetails, fieldId, fillFromAccount, initialDetails, validateDetails, type FormErrors } from "../../utils/guestForm";
import ContactFields from "@/components/forms/ContactFields";
import RoomGuests from "./RoomGuests";
import { styles } from "./GuestDetailsForm.styles";

interface GuestDetailsFormProps {
  checkout: CheckoutSummary;
  // Saves the details; rejects with the backend's message.
  onSubmit: (details: CheckoutGuestDetails) => Promise<void>;
  disabled: boolean;
}

// Contact, guests per room, special requests, and the acceptances, with an
// accessible error summary at the top (spec §4.4).
export default function GuestDetailsForm({ checkout, onSubmit, disabled }: GuestDetailsFormProps) {
  const [details, setDetails] = useState(() => initialDetails(checkout));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const update = (changes: Partial<CheckoutGuestDetails>) => setDetails((previous) => ({ ...previous, ...changes }));
  const { user, status } = useAuth();
  const saved = useSavedTravellers();
  const takenNames = details.rooms.flatMap((room) => room.guests.map((guest) => travellerKey(guest.firstName, guest.lastName)));

  // Signed in (now or once the session loads): fill in what's still empty.
  useEffect(() => {
    if (user) setDetails((previous) => fillFromAccount(previous, user));
  }, [user]);

  // Re-check fields as the visitor fixes them, once they've tried to submit.
  const tried = useRef(false);
  useEffect(() => {
    if (tried.current) setErrors(validateDetails(details, checkout));
  }, [details, checkout]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    tried.current = true;
    const found = validateDetails(details, checkout);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSaving(true);
    try {
      await onSubmit(cleanDetails(details, checkout));
    } catch (error) {
      setServerError((error as Error).message);
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setSaving(false);
    }
  }

  const messages = Object.entries(errors);
  return (
    <Box component="form" onSubmit={submit} noValidate aria-label="Guest details" sx={styles.root}>
      {(messages.length > 0 || serverError) && (
        <Alert severity="error" ref={summaryRef} tabIndex={-1} sx={styles.errors}>
          <Typography sx={styles.errorsTitle}>{serverError ?? "Please check these details:"}</Typography>
          {messages.length > 0 && (
            <Box component="ul" sx={styles.errorList}>
              {messages.map(([id, message]) => (
                <li key={id}>
                  <MuiLink href={`#${id}`} color="inherit">
                    {message}
                  </MuiLink>
                </li>
              ))}
            </Box>
          )}
        </Alert>
      )}

      <Box component="section" sx={styles.card} aria-labelledby="contact-title">
        <Typography component="h2" id="contact-title" sx={styles.title}>
          Contact details
        </Typography>
        {status === "anonymous" && (
          <Typography sx={styles.hint}>
            Have an account?{" "}
            <MuiLink component={Link} href={`${routes.login}?${new URLSearchParams({ next: `${routes.checkout}/${checkout.checkoutId}` })}`}>
              Log in to fill in your details
            </MuiLink>
            , or continue as a guest.
          </Typography>
        )}
        <ContactFields
          value={details.contact}
          onChange={(contact) => update({ contact })}
          errors={{ email: errors[fieldId("email")], phoneCode: errors[fieldId("phone-code")], phone: errors[fieldId("phone")] }}
          ids={{ email: fieldId("email"), phoneCode: fieldId("phone-code"), phone: fieldId("phone") }}
          hint="We'll send the booking confirmation and any updates here."
        />
      </Box>

      <Box component="section" sx={styles.card} aria-labelledby="guests-title">
        <Typography component="h2" id="guests-title" sx={styles.title}>
          Who&apos;s staying?
        </Typography>
        <Typography sx={styles.hint}>Enter names exactly as on each guest&apos;s photo ID. The main guest checks in.</Typography>
        {checkout.rooms.map((room, r) => (
          <RoomGuests
            key={r}
            index={r}
            room={room}
            roomName={checkout.room.roomName}
            showRoomTitle={checkout.rooms.length > 1}
            guests={details.rooms[r]!.guests}
            needsPan={checkout.requirements.pan}
            needsPassport={checkout.requirements.passport}
            errors={errors}
            onChange={(guests) => update({ rooms: details.rooms.map((current, i) => (i === r ? { guests } : current)) })}
            saved={saved}
            takenNames={takenNames}
          />
        ))}
      </Box>

      <Box component="section" sx={styles.card} aria-labelledby="requests-title">
        <Typography component="h2" id="requests-title" sx={styles.title}>
          Special requests <Box component="span" sx={styles.optional}>(optional)</Box>
        </Typography>
        <TextField
          id={fieldId("requests")}
          multiline
          minRows={3}
          fullWidth
          placeholder="e.g. a high floor, early check-in, an extra pillow"
          value={details.specialRequests ?? ""}
          onChange={(event) => update({ specialRequests: event.target.value })}
          error={Boolean(errors[fieldId("requests")])}
          helperText={errors[fieldId("requests")] ?? "We'll pass these on to the hotel. They depend on availability and aren't guaranteed."}
          slotProps={{ htmlInput: { maxLength: 500, "aria-label": "Special requests" } }}
        />
      </Box>

      {checkout.policies.length > 0 && (
        <Box component="section" sx={styles.card} aria-labelledby="policies-title">
          <Typography component="h2" id="policies-title" sx={styles.title}>
            Before you book
          </Typography>
          {checkout.policies.map((section) => (
            <Box key={section.title} sx={styles.policy}>
              <Typography component="h3" sx={styles.policyTitle}>
                {section.title}
              </Typography>
              {section.paragraphs.map((paragraph, i) => (
                <Typography key={i} sx={styles.policyText}>
                  {paragraph}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      )}

      <Box sx={styles.card}>
        {checkout.priceChange && (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  id={fieldId("accept-price")}
                  checked={Boolean(details.acceptPriceChange)}
                  onChange={(event) => update({ acceptPriceChange: event.target.checked })}
                />
              }
              label={`I accept the new price of ${formatPrice(checkout.priceChange.current)}`}
            />
            {errors[fieldId("accept-price")] && <FormHelperText error>{errors[fieldId("accept-price")]}</FormHelperText>}
          </Box>
        )}
        <Box>
          <FormControlLabel
            sx={styles.terms}
            control={
              <Checkbox id={fieldId("accept-terms")} checked={details.acceptTerms} onChange={(event) => update({ acceptTerms: event.target.checked })} />
            }
            label={
              <span>
                I accept the{" "}
                <MuiLink component={Link} href={routes.terms} target="_blank">
                  terms of booking
                </MuiLink>{" "}
                and this room&apos;s cancellation policy ({checkout.room.freeCancellation ? "free cancellation until the date shown" : "non-refundable"}).
              </span>
            }
          />
          {errors[fieldId("accept-terms")] && <FormHelperText error>{errors[fieldId("accept-terms")]}</FormHelperText>}
        </Box>
        <Button type="submit" variant="contained" size="large" disabled={saving || disabled} sx={styles.submit}>
          {saving ? "Saving…" : "Continue to payment"}
        </Button>
      </Box>
    </Box>
  );
}
