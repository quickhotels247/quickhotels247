"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import type { CabinClass, FareCalendar, TripType } from "@quickhotels/types/flights";
import DateRangeCalendar from "@/components/common/DateRangeCalendar";
import SearchFieldShell from "@/components/search/SearchFieldShell";
import { flightsApi } from "@/lib/api/flights";
import { formatDayDate, formatShortDate, todayIso } from "@/lib/dates";
import { styles } from "./FlightDatesField.styles";

interface FlightDatesFieldProps {
  tripType: TripType;
  depart: string;
  // Named returnDate because `return` is a reserved word.
  returnDate: string;
  onChange: (depart: string, returnDate: string) => void;
  invalid: boolean;
  // Earliest allowed departure (a multi-city flight can't be before the last).
  minDate?: string;
  label?: string;
  // Opens the calendar each time this number goes up (e.g. switching to round trip).
  openSignal?: number;
  // The route, for recent fares under the dates (left out for multi-city).
  from?: string;
  to?: string;
  cabin?: CabinClass;
}

const fareLabel = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

// Opens a two-month calendar: depart then return for round trips, one date
// otherwise.
export default function FlightDatesField({
  tripType,
  depart,
  returnDate,
  onChange,
  invalid,
  minDate,
  label: caption = "Travel dates",
  openSignal = 0,
  from = "",
  to = "",
  cabin = "economy",
}: FlightDatesFieldProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (openSignal > 0 && trigger.current) setAnchor(trigger.current);
  }, [openSignal]);
  const open = anchor !== null;
  const panelId = useId();
  const earliest = minDate && minDate > todayIso() ? minDate : todayIso();
  const roundTrip = tripType === "roundTrip";

  // Recent fares for the months on show: outbound, or the way back while
  // picking a return date.
  const [month, setMonth] = useState("");
  const [fares, setFares] = useState<FareCalendar | null>(null);
  const choosingReturn = roundTrip && Boolean(depart) && !returnDate;
  const [origin, destination] = choosingReturn ? [to, from] : [from, to];
  useEffect(() => {
    setFares(null);
    if (!open || !month || !origin || !destination || origin === destination) return;
    const controller = new AbortController();
    const first = `${month}-01`;
    flightsApi
      .fareCalendar({ from: origin, to: destination, cabin, start: first < earliest ? earliest : first, days: 62 }, controller.signal)
      .then(setFares)
      .catch(() => undefined);
    return () => controller.abort();
  }, [open, month, origin, destination, cabin, earliest]);
  const prices = useMemo(() => {
    if (!fares?.days.length) return undefined;
    const lowest = Math.min(...fares.days.map((day) => day.amount));
    return Object.fromEntries(fares.days.map((day) => [day.date, { label: fareLabel(day.amount), cheapest: day.amount === lowest }]));
  }, [fares]);

  const placeholder = roundTrip ? "Depart – Return" : "Add date";
  const label = !depart
    ? placeholder
    : roundTrip
      ? `${formatShortDate(depart)} – ${returnDate ? formatShortDate(returnDate) : "Return"}`
      : formatShortDate(depart);
  const summary = !depart
    ? "Select your departure date"
    : !roundTrip
      ? formatDayDate(depart)
      : !returnDate
        ? `${formatDayDate(depart)} – select your return date`
        : `${formatDayDate(depart)} – ${formatDayDate(returnDate)}`;

  return (
    <SearchFieldShell icon={<CalendarMonthOutlined />} label={caption} invalid={invalid}>
      <ButtonBase
        ref={trigger}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${caption}: ${label}`}
        sx={styles.trigger(Boolean(depart))}
      >
        {label}
      </ButtonBase>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{ paper: { id: panelId, role: "dialog", "aria-label": `Choose ${caption.toLowerCase()}`, sx: styles.paper } }}
      >
        <DateRangeCalendar
          mode={roundTrip ? "range" : "single"}
          start={depart}
          end={roundTrip ? returnDate : ""}
          onChange={(start, end) => {
            onChange(start, roundTrip ? end : "");
            // One date is all a one-way or multi-city flight needs.
            if (!roundTrip) setAnchor(null);
          }}
          minDate={earliest}
          allowSameDay
          prices={prices}
          onMonthChange={setMonth}
        />
        {prices && (
          <Typography sx={styles.faresNote}>
            Lowest fares per adult{choosingReturn ? " for the return" : ""} from recent searches. The price is confirmed when you search.
          </Typography>
        )}
        <Box sx={styles.footer}>
          <Typography sx={styles.summary} aria-live="polite">
            {summary}
          </Typography>
          <Button variant="contained" onClick={() => setAnchor(null)} disabled={roundTrip && Boolean(depart && !returnDate)}>
            Done
          </Button>
        </Box>
      </Popover>
    </SearchFieldShell>
  );
}
