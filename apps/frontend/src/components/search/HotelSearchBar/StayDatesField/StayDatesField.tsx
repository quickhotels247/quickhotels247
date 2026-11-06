"use client";

import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import DateRangeCalendar from "@/components/common/DateRangeCalendar";
import SearchFieldShell from "@/components/search/SearchFieldShell";
import { formatDayDate, formatShortDate, nightsBetween, todayIso } from "@/lib/dates";
import { styles } from "./StayDatesField.styles";

interface StayDatesFieldProps {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  invalid: boolean;
}

// "Check In – Check Out" button opening a two-month calendar: click check-in,
// then check-out.
export default function StayDatesField({ checkIn, checkOut, onChange, invalid }: StayDatesFieldProps) {
  // The button the panel opens under; null while it's closed.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const panelId = useId();

  const label =
    checkIn && checkOut ? `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}` : "Check In – Check Out";
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const summary = !checkIn
    ? "Select your check-in date"
    : !checkOut
      ? `${formatDayDate(checkIn)} – select your check-out date`
      : `${formatDayDate(checkIn)} – ${formatDayDate(checkOut)} · ${nights} night${nights === 1 ? "" : "s"}`;

  return (
    <SearchFieldShell icon={<CalendarMonthOutlined />} invalid={invalid}>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Stay dates: ${label}`}
        sx={styles.trigger(Boolean(checkIn && checkOut))}
      >
        {label}
      </ButtonBase>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{ paper: { id: panelId, role: "dialog", "aria-label": "Choose stay dates", sx: styles.paper } }}
      >
        <DateRangeCalendar mode="range" start={checkIn} end={checkOut} onChange={onChange} minDate={todayIso()} />
        <Box sx={styles.footer}>
          <Typography sx={styles.summary} aria-live="polite">
            {summary}
          </Typography>
          <Button variant="contained" onClick={() => setAnchor(null)} disabled={Boolean(checkIn && !checkOut)}>
            Done
          </Button>
        </Box>
      </Popover>
    </SearchFieldShell>
  );
}
