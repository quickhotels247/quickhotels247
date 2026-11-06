import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { BookingListItem } from "@quickhotels/types/bookings";
import BookingStatusChip from "@/components/booking/BookingStatusChip";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import { routes } from "@/config/navigation";
import { formatShortDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { styles } from "./BookingCard.styles";

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

// One booking: photo, hotel, status, dates, guests, reference and total.
export default function BookingCard({ booking }: { booking: BookingListItem }) {
  const href = `${routes.myBookings}/${encodeURIComponent(booking.reference)}`;
  const guests = [plural(booking.adults, "adult"), booking.children > 0 && plural(booking.children, "child", "children")].filter(Boolean).join(", ");
  return (
    <Card component="article" sx={styles.root}>
      <Box sx={styles.photo}>
        <HotelPhoto src={booking.hotel.imageUrl} alt={booking.hotel.name} sizes="(max-width: 600px) 30vw, 180px" />
      </Box>
      <Box sx={styles.body}>
        <Box sx={styles.top}>
          <Typography component="h2" sx={styles.name}>
            {booking.hotel.name}
          </Typography>
          <BookingStatusChip status={booking.status} />
        </Box>
        <Typography sx={styles.meta}>
          {formatShortDate(booking.checkIn)} – {formatShortDate(booking.checkOut)} · {plural(booking.nights, "night")} · {guests}
          {booking.rooms > 1 ? ` · ${plural(booking.rooms, "room")}` : ""}
        </Typography>
        <Typography sx={styles.meta}>
          {booking.hotel.city ? `${booking.hotel.city} · ` : ""}Booking ref <strong>{booking.reference}</strong>
        </Typography>
        <Box sx={styles.bottom}>
          <Typography sx={styles.total}>{formatPrice(booking.total)}</Typography>
          <Button component={Link} href={href} variant="outlined" size="small">
            View details
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
