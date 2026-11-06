import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LoginRounded from "@mui/icons-material/LoginRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import type { HotelDetails } from "@quickhotels/types/hotels";
import { formatClock } from "@/lib/dates";
import { styles } from "./HotelPolicies.styles";

interface HotelPoliciesProps {
  hotel: HotelDetails;
}

// "From 2:00 PM", "11:00 AM – 12:00 PM"…
const range = (from: string | null, until: string | null, fallback: string) =>
  from && until
    ? `${formatClock(from)} – ${formatClock(until)}`
    : from
      ? `From ${formatClock(from)}`
      : until
        ? `Until ${formatClock(until)}`
        : fallback;

// Check-in and check-out times, then the hotel's rules and fees (fees paid at
// the property first: they must be seen before booking).
export default function HotelPolicies({ hotel }: HotelPoliciesProps) {
  return (
    <Box sx={styles.root}>
      <Box sx={styles.times}>
        <Box sx={styles.time}>
          <LoginRounded sx={styles.icon} aria-hidden="true" />
          <Box>
            <Typography sx={styles.label}>Check-in</Typography>
            <Typography sx={styles.value}>{range(hotel.checkIn.from, hotel.checkIn.until, "As per hotel policy")}</Typography>
            {hotel.checkIn.minAge && <Typography sx={styles.note}>Minimum age to check in: {hotel.checkIn.minAge}</Typography>}
          </Box>
        </Box>
        <Box sx={styles.time}>
          <LogoutRounded sx={styles.icon} aria-hidden="true" />
          <Box>
            <Typography sx={styles.label}>Check-out</Typography>
            <Typography sx={styles.value}>{range(hotel.checkOut.from, hotel.checkOut.until, "As per hotel policy")}</Typography>
          </Box>
        </Box>
      </Box>
      {hotel.policies.map((section) => (
        <Box key={section.title} sx={styles.section}>
          <Typography component="h3" sx={styles.sectionTitle}>
            {section.title}
          </Typography>
          {section.paragraphs.map((paragraph, i) => (
            <Typography key={i} sx={styles.paragraph}>
              {paragraph}
            </Typography>
          ))}
        </Box>
      ))}
      <Typography sx={styles.note}>
        Photo ID is needed at check-in. The hotel may ask for a security deposit or extra charges for extra guests or
        early check-in, as per its own policy.
      </Typography>
    </Box>
  );
}
