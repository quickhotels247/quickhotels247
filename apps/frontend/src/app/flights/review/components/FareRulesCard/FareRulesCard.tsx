"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { FlightFareRule } from "@quickhotels/types/flight-checkout";
import { formatPrice } from "@/lib/format";
import { styles } from "./FareRulesCard.styles";

const TITLES: Record<FlightFareRule["type"], string> = {
  cancellation: "Cancellation",
  dateChange: "Date change",
  noShow: "No-show",
};

// "₹3,000 airline fee + ₹115 service fee", or what the airline says.
function charge(rule: FlightFareRule) {
  if (!rule.airlineFee && !rule.serviceFee) return rule.notes.length ? null : "See the airline's rules";
  const parts = [
    rule.airlineFee && `${formatPrice(rule.airlineFee)} airline fee`,
    rule.serviceFee && `${formatPrice(rule.serviceFee)} service fee`,
  ].filter(Boolean);
  return `${parts.join(" + ")}${rule.type === "dateChange" ? " + any fare difference" : ""}`;
}

// What changing, cancelling or missing the flight costs, by time before
// departure (shown before paying, as the spec asks).
export default function FareRulesCard({ rules }: { rules: FlightFareRule[] }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const routes = [...new Set(rules.map((rule) => rule.route))];
  return (
    <Box component="section" aria-labelledby="rules-title" sx={styles.root}>
      <Typography component="h2" id="rules-title" sx={styles.heading}>
        Change and cancellation rules
      </Typography>
      {!rules.length ? (
        <Typography sx={styles.empty}>
          The airline&apos;s rules for this fare will be shared with your booking confirmation. Changes and cancellations usually carry airline fees.
        </Typography>
      ) : (
        (Object.keys(TITLES) as FlightFareRule["type"][]).map((type) => {
          const ofType = rules.filter((rule) => rule.type === type);
          if (!ofType.length) return null;
          return (
            <Box key={type} sx={styles.group}>
              <Typography component="h3" sx={styles.groupTitle}>
                {TITLES[type]}
              </Typography>
              {ofType.map((rule, i) => (
                <Box key={i} sx={styles.rule}>
                  <Typography sx={styles.when}>
                    {routes.length > 1 && <Box component="span" sx={styles.route}>{rule.route.replace("-", " → ")} · </Box>}
                    {rule.when}
                  </Typography>
                  {charge(rule) && <Typography sx={styles.charge}>{charge(rule)}</Typography>}
                  {/* Without a fee, the airline's words are the rule, so they always show. */}
                  {(notesOpen || !charge(rule)) && rule.notes.map((note, n) => <Typography key={n} sx={styles.note}>{note}</Typography>)}
                </Box>
              ))}
            </Box>
          );
        })
      )}
      {rules.some((rule) => rule.notes.length) && (
        <Button size="small" onClick={() => setNotesOpen((open) => !open)} sx={styles.toggle}>
          {notesOpen ? "Hide the airline's wording" : "Show the airline's wording"}
        </Button>
      )}
    </Box>
  );
}
