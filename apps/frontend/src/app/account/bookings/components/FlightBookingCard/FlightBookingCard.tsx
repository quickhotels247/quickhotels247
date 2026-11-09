import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import FlightTakeoffRounded from "@mui/icons-material/FlightTakeoffRounded";
import type { FlightBookingListItem, FlightReviewStatus } from "@quickhotels/types/flight-checkout";
import { routes } from "@/config/navigation";
import { formatPrice } from "@/lib/format";
import { styles } from "./FlightBookingCard.styles";

const STATUS: Partial<Record<FlightReviewStatus, { label: string; color: "success" | "warning" | "error" }>> = {
  confirmed: { label: "Confirmed", color: "success" },
  processing: { label: "Ticketing", color: "warning" },
  failed: { label: "Not booked · refunded", color: "error" },
};
const when = (local: string) => {
  const [day = "", time = ""] = local.split("T");
  return `${new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}, ${time.slice(0, 5)}`;
};

// One flight booking: route per leg with date and airline, PNR, status, paid.
export default function FlightBookingCard({ booking }: { booking: FlightBookingListItem }) {
  const status = STATUS[booking.status];
  return (
    <Card component="article" sx={styles.root}>
      <Box sx={styles.icon} aria-hidden="true">
        <FlightTakeoffRounded />
      </Box>
      <Box sx={styles.body}>
        <Box sx={styles.top}>
          <Typography component="h2" sx={styles.route}>
            {booking.legs.map((leg) => `${leg.from} → ${leg.to}`).join(" · ")}
          </Typography>
          {status && <Chip size="small" variant="outlined" color={status.color} label={status.label} sx={styles.chip} />}
        </Box>
        {booking.legs.map((leg, i) => (
          <Typography key={i} sx={styles.meta}>
            {when(leg.departAt)} · {leg.airlines}
          </Typography>
        ))}
        <Typography sx={styles.meta}>
          {booking.travellers} traveller{booking.travellers === 1 ? "" : "s"}
          {booking.pnrs.length ? (
            <>
              {" "}· PNR <strong>{booking.pnrs.join(", ")}</strong>
            </>
          ) : null}
        </Typography>
        <Box sx={styles.bottom}>
          <Typography sx={styles.total}>{formatPrice(booking.paid)}</Typography>
          <Button component={Link} href={`${routes.flightBooking}/${booking.id}`} variant="outlined" size="small">
            View details
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
