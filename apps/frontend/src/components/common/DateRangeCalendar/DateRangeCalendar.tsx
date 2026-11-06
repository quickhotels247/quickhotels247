"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { addMonths, monthOf } from "@/lib/dates";
import MonthGrid from "./MonthGrid";
import { styles } from "./DateRangeCalendar.styles";

interface DateRangeCalendarProps {
  // "range": pick a start, then an end. "single": pick one date.
  mode: "range" | "single";
  start: string; // YYYY-MM-DD or ""
  end: string; // YYYY-MM-DD or "" (unused in single mode)
  onChange: (start: string, end: string) => void;
  // Earliest selectable day, YYYY-MM-DD.
  minDate: string;
  // Hotels need at least one night; a flight can return the same day.
  allowSameDay?: boolean;
}

// Two months side by side (one on phones), like Booking.com's date picker.
// In range mode the first click sets the start, the second the end, and the
// days between are shaded, previewing as you hover.
export default function DateRangeCalendar({ mode, start, end, onChange, minDate, allowSameDay = false }: DateRangeCalendarProps) {
  const [month, setMonth] = useState(() => monthOf(start || minDate));
  const [hovered, setHovered] = useState<string | null>(null);
  const firstMonth = monthOf(minDate);

  function pick(day: string) {
    if (mode === "single") return onChange(day, "");
    // Start again once a range is complete, or when going before the start.
    if (!start || end || day < start || (day === start && !allowSameDay)) return onChange(day, "");
    onChange(start, day);
  }

  // While choosing the end, shade up to the hovered day.
  const previewEnd = mode === "range" && start && !end && hovered && hovered >= start ? hovered : "";
  const shared = { start, end: end || previewEnd, minDate, onPick: pick, onHover: setHovered };

  return (
    <Box sx={styles.root} onMouseLeave={() => setHovered(null)}>
      <IconButton
        onClick={() => setMonth(addMonths(month, -1))}
        disabled={month <= firstMonth}
        aria-label="Previous month"
        sx={styles.nav("left")}
      >
        <ChevronLeftRounded />
      </IconButton>
      <IconButton onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month" sx={styles.nav("right")}>
        <ChevronRightRounded />
      </IconButton>
      <Box sx={styles.months}>
        <MonthGrid month={month} {...shared} />
        <Box sx={styles.secondMonth}>
          <MonthGrid month={addMonths(month, 1)} {...shared} />
        </Box>
      </Box>
    </Box>
  );
}
