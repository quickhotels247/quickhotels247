"use client";

import { useEffect, useId, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import type { TripType } from "@quickhotels/types/flights";
import DateRangeCalendar from "@/components/common/DateRangeCalendar";
import SearchFieldShell from "@/components/search/SearchFieldShell";
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
}

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
        />
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
