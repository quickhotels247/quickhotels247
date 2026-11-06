import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { BookingDetails } from "@quickhotels/types/bookings";
import { BOOKING_STATUS } from "@/lib/bookingStatus";
import { styles } from "./StatusTimeline.styles";

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

// Booked → Confirmed → …, oldest first, with India times.
export default function StatusTimeline({ timeline }: { timeline: BookingDetails["timeline"] }) {
  if (!timeline.length) return null;
  return (
    <Box component="section" aria-labelledby="timeline-title" sx={styles.root}>
      <Typography component="h2" id="timeline-title" sx={styles.title}>
        Booking history
      </Typography>
      <Box component="ol" sx={styles.list}>
        {timeline.map((entry, i) => (
          <Box component="li" key={entry.status} sx={styles.item}>
            <Box sx={[styles.dot, i === timeline.length - 1 && styles.dotCurrent]} aria-hidden="true" />
            <Box>
              <Typography sx={styles.status}>{BOOKING_STATUS[entry.status].label}</Typography>
              <Typography sx={styles.time}>{time(entry.at)}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
