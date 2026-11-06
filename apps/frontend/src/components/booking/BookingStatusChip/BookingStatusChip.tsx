import Chip from "@mui/material/Chip";
import type { BookingDisplayStatus } from "@quickhotels/types/bookings";
import { BOOKING_STATUS } from "@/lib/bookingStatus";
import { styles } from "./BookingStatusChip.styles";

// "CONFIRMED", "CONFIRMATION PENDING"…: a booking's status at a glance.
export default function BookingStatusChip({ status }: { status: BookingDisplayStatus }) {
  const { label, color } = BOOKING_STATUS[status];
  return <Chip label={label} color={color} size="small" variant={color === "default" ? "outlined" : "filled"} sx={styles.root} />;
}
