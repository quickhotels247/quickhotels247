import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import EventOutlined from "@mui/icons-material/EventOutlined";
import FreeBreakfastOutlined from "@mui/icons-material/FreeBreakfastOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import type { BookingDetails } from "@quickhotels/types/bookings";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import StarRating from "@/components/hotel/StarRating";
import { formatDayDate } from "@/lib/dates";
import { styles } from "./StayCard.styles";

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

// The hotel, dates, each room with its meal plan, and who's staying.
export default function StayCard({ booking }: { booking: BookingDetails }) {
  const { hotel } = booking;
  const map =
    hotel.latitude !== null && hotel.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`
      : null;
  return (
    <Box component="section" aria-label="Your stay" sx={styles.root}>
      <Box sx={styles.hotel}>
        <Box sx={styles.photo}>
          <HotelPhoto src={hotel.imageUrl} alt={hotel.name} sizes="140px" />
        </Box>
        <Box sx={styles.hotelText}>
          <StarRating stars={hotel.starRating} />
          <Typography component="h2" sx={styles.name}>
            {hotel.name}
          </Typography>
          {hotel.address && (
            <Typography sx={styles.address}>
              <PlaceOutlined sx={styles.icon} aria-hidden="true" />
              <span>
                {hotel.address}
                {map && (
                  <>
                    {" "}
                    <Link href={map} target="_blank" rel="noopener noreferrer">
                      Map
                    </Link>
                  </>
                )}
              </span>
            </Typography>
          )}
        </Box>
      </Box>
      <Divider />
      <Box sx={styles.dates}>
        <Box>
          <Typography sx={styles.label}>Check-in</Typography>
          <Typography sx={styles.value}>{formatDayDate(booking.checkIn)}</Typography>
        </Box>
        <Box>
          <Typography sx={styles.label}>Check-out</Typography>
          <Typography sx={styles.value}>{formatDayDate(booking.checkOut)}</Typography>
        </Box>
        <Box>
          <Typography sx={styles.label}>Length of stay</Typography>
          <Typography sx={styles.value}>
            <EventOutlined sx={styles.icon} aria-hidden="true" />
            {plural(booking.nights, "night")}
          </Typography>
        </Box>
      </Box>
      <Divider />
      {booking.roomsBooked.map((room, r) => (
        <Box key={r} sx={styles.room}>
          <Typography sx={styles.roomName}>
            {booking.roomsBooked.length > 1 ? `Room ${r + 1}: ` : ""}
            {room.name}
          </Typography>
          <Typography sx={styles.meta}>
            <FreeBreakfastOutlined sx={styles.icon} aria-hidden="true" />
            {room.mealPlan ? (room.mealPlan === "Breakfast" ? "Breakfast included" : room.mealPlan) : "Room only"} ·{" "}
            {plural(room.adults, "adult")}
            {room.childAges.length > 0 ? `, ${plural(room.childAges.length, "child", "children")}` : ""}
          </Typography>
          {room.guests.length > 0 && (
            <Typography sx={styles.guests}>
              {room.guests.map((guest) => `${guest.title ? `${guest.title} ` : ""}${guest.firstName} ${guest.lastName}${guest.lead ? " (main guest)" : ""}`).join(", ")}
            </Typography>
          )}
        </Box>
      ))}
      {booking.specialRequests && (
        <Typography sx={styles.requests}>
          <strong>Your requests:</strong> {booking.specialRequests} (passed to the hotel; not guaranteed)
        </Typography>
      )}
    </Box>
  );
}
