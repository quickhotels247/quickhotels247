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
import Typography from "@mui/material/Typography";
import type { FlightReviewSummary, FlightTravellerDetails, FlightTravellerType } from "@quickhotels/types/flight-checkout";
import ContactFields from "@/components/forms/ContactFields";
import { routes } from "@/config/navigation";
import SavedTravellerPicker from "@/components/forms/SavedTravellerPicker";
import { useAuth } from "@/lib/auth/useAuth";
import { travellerKey, useSavedTravellers } from "@/lib/hooks/useSavedTravellers";
import { fillContact } from "@/lib/contactFill";
import { formatPrice } from "@/lib/format";
import { cleanDetails, fieldId, fromSaved, initialDetails, needsDob, TYPE_LABEL, validateDetails, type FormErrors } from "../../utils/travellerForm";
import EmergencyContactFields from "./EmergencyContactFields";
import GstFields from "./GstFields";
import TravellerCard from "./TravellerCard";
import { styles } from "./TravellersForm.styles";

interface TravellersFormProps {
  review: FlightReviewSummary;
  disabled: boolean;
  onSubmit: (details: FlightTravellerDetails) => Promise<void>;
  onBack: () => void;
}

// Travellers (flights step F5): names as on ID and what the fare needs,
// contact, GST and emergency contact when relevant, and the acceptances,
// with an error summary that links to each field.
export default function TravellersForm({ review, disabled, onSubmit, onBack }: TravellersFormProps) {
  const [details, setDetails] = useState(() => initialDetails(review));
  const [wantGst, setWantGst] = useState(Boolean(review.travellerDetails?.gst));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const tried = useRef(false);
  const { user, status } = useAuth();
  const saved = useSavedTravellers();
  const needs = review.requirements;
  const update = (changes: Partial<FlightTravellerDetails>) => setDetails((previous) => ({ ...previous, ...changes }));

  // Signed in: fill the first adult (name, date of birth) and the contact when still empty.
  useEffect(() => {
    if (!user) return;
    setDetails((previous) => {
      const [first, ...rest] = previous.travellers;
      const fillName = first && !first.firstName && !first.lastName;
      return {
        ...previous,
        contact: fillContact(previous.contact, user),
        travellers: fillName
          ? [{ ...first, firstName: user.firstName, lastName: user.lastName, dateOfBirth: first.dateOfBirth ?? user.dateOfBirth ?? undefined }, ...rest]
          : previous.travellers,
      };
    });
  }, [user]);

  useEffect(() => {
    if (tried.current) setErrors(validateDetails(details, review, wantGst));
  }, [details, review, wantGst]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    tried.current = true;
    const found = validateDetails(details, review, wantGst);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSaving(true);
    try {
      await onSubmit(cleanDetails(details, review, wantGst));
    } catch (error) {
      setServerError((error as Error).message);
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setSaving(false);
    }
  }

  const counter: Record<FlightTravellerType, number> = { adult: 0, child: 0, infant: 0 };
  const messages = Object.entries(errors);
  return (
    <Box component="form" onSubmit={submit} noValidate aria-label="Traveller details" sx={styles.root}>
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

      <Box component="section" sx={styles.card} aria-labelledby="travellers-title">
        <Typography component="h2" id="travellers-title" sx={styles.title}>
          Who&apos;s flying?
        </Typography>
        <Typography sx={styles.hint}>
          Enter names exactly as on each traveller&apos;s passport or government ID. Airlines may refuse boarding if they don&apos;t match.
        </Typography>
        {status === "anonymous" && (
          <Typography sx={styles.hint}>
            Have an account?{" "}
            <MuiLink component={Link} href={`${routes.login}?${new URLSearchParams({ next: `${routes.flightReview}/${review.reviewId}` })}`}>
              Log in to fill in your details
            </MuiLink>
            , or continue as a guest.
          </Typography>
        )}
        <Box sx={styles.travellers}>
          {details.travellers.map((traveller, i) => (
            <TravellerCard
              key={i}
              index={i}
              number={++counter[traveller.type]}
              traveller={traveller}
              requirements={needs}
              needsDob={needsDob(review, traveller.type)}
              errors={errors}
              onChange={(next) => update({ travellers: details.travellers.map((current, j) => (j === i ? next : current)) })}
              action={
                <SavedTravellerPicker
                  travellers={saved}
                  label={`${TYPE_LABEL[traveller.type]} ${counter[traveller.type]}`}
                  taken={new Set(details.travellers.filter((_, j) => j !== i).map((other) => travellerKey(other.firstName, other.lastName)))}
                  onPick={(pick) => update({ travellers: details.travellers.map((current, j) => (j === i ? fromSaved(current, pick) : current)) })}
                />
              }
            />
          ))}
        </Box>
      </Box>

      <Box component="section" sx={styles.card} aria-labelledby="contact-title">
        <Typography component="h2" id="contact-title" sx={styles.title}>
          Contact details
        </Typography>
        <ContactFields
          value={details.contact}
          onChange={(contact) => update({ contact })}
          errors={{ email: errors[fieldId("email")], phoneCode: errors[fieldId("phone-code")], phone: errors[fieldId("phone")] }}
          ids={{ email: fieldId("email"), phoneCode: fieldId("phone-code"), phone: fieldId("phone") }}
          hint="We'll send your tickets and any flight changes here."
        />
        {needs.emergencyContact && (
          <Box sx={styles.sub}>
            <Typography component="h3" sx={styles.subTitle}>
              Emergency contact
            </Typography>
            <Typography sx={styles.hint}>Someone not on this trip whom the airline can reach.</Typography>
            <EmergencyContactFields value={details.emergencyContact} errors={errors} onChange={(emergencyContact) => update({ emergencyContact })} />
          </Box>
        )}
        {needs.gst !== "none" && (
          <Box sx={styles.sub}>
            {needs.gst === "optional" ? (
              <FormControlLabel control={<Checkbox checked={wantGst} onChange={(event) => setWantGst(event.target.checked)} />} label="I want a GST invoice for my company" />
            ) : (
              <Typography component="h3" sx={styles.subTitle}>
                GST details (required for this fare)
              </Typography>
            )}
            {(wantGst || needs.gst === "required") && <GstFields value={details.gst} errors={errors} onChange={(gst) => update({ gst })} />}
          </Box>
        )}
      </Box>

      <Box sx={styles.card}>
        {review.priceChange && (
          <Box>
            <FormControlLabel
              control={<Checkbox id={fieldId("accept-price")} checked={Boolean(details.acceptPriceChange)} onChange={(event) => update({ acceptPriceChange: event.target.checked })} />}
              label={`I accept the new price of ${formatPrice(review.priceChange.current)}`}
            />
            {errors[fieldId("accept-price")] && <FormHelperText error>{errors[fieldId("accept-price")]}</FormHelperText>}
          </Box>
        )}
        <Box>
          <FormControlLabel
            sx={styles.terms}
            control={<Checkbox id={fieldId("accept-terms")} checked={details.acceptTerms} onChange={(event) => update({ acceptTerms: event.target.checked })} />}
            label={
              <span>
                I accept the{" "}
                <MuiLink component={Link} href={routes.terms} target="_blank">
                  terms of booking
                </MuiLink>{" "}
                and this fare&apos;s change and cancellation rules.
              </span>
            }
          />
          {errors[fieldId("accept-terms")] && <FormHelperText error>{errors[fieldId("accept-terms")]}</FormHelperText>}
        </Box>
        <Box sx={styles.actions}>
          <Button onClick={onBack} disabled={saving}>
            Back to fare
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={saving || disabled} sx={styles.submit}>
            {saving ? "Saving…" : "Continue to payment"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
