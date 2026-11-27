import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { AdminFlightStatus, AdminHotelStatus, DashboardRecentBooking } from "@quickhotels/types/admin";
import { FlightStatusChip, HotelStatusChip } from "@/components/admin/StatusChip";
import { formatPrice } from "@/lib/format";
import { ago, bookingHref } from "../AttentionList/AttentionList";
import { styles } from "./RecentBookings.styles";

// The latest paid bookings, hotels and flights together.
export default function RecentBookings({ bookings }: { bookings: DashboardRecentBooking[] }) {
  if (!bookings.length) return <Typography sx={styles.empty}>No paid bookings yet.</Typography>;
  return (
    <Box component="ul" sx={styles.list}>
      {bookings.map((booking) => (
        <Box component="li" key={`${booking.product}-${booking.bookingId}`}>
          <Box component={Link} href={bookingHref(booking.product, booking.bookingId)} sx={styles.row}>
            <Box sx={styles.main}>
              <Typography sx={styles.title}>
                <span className="ref">{booking.reference}</span> · {booking.title}
              </Typography>
              <Typography sx={styles.meta}>{[booking.product === "hotel" ? "Hotel" : "Flight", booking.customer, `paid ${ago(booking.paidAt)}`].filter(Boolean).join(" · ")}</Typography>
            </Box>
            <Box sx={styles.side}>
              <Typography sx={styles.amount}>{formatPrice({ amount: booking.amount, currency: "INR" })}</Typography>
              {booking.product === "hotel" ? <HotelStatusChip status={booking.status as AdminHotelStatus} /> : <FlightStatusChip status={booking.status as AdminFlightStatus} />}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
