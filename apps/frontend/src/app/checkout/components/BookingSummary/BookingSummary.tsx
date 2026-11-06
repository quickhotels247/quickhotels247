import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import CheckRounded from "@mui/icons-material/CheckRounded";
import EventOutlined from "@mui/icons-material/EventOutlined";
import FreeBreakfastOutlined from "@mui/icons-material/FreeBreakfastOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import type { CheckoutSummary } from "@quickhotels/types/checkout";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import StarRating from "@/components/hotel/StarRating";
import { formatClock, formatDayDate, formatShortDate } from "@/lib/dates";
import PriceBreakdown from "./PriceBreakdown";
import { styles } from "./BookingSummary.styles";

interface BookingSummaryProps {
  checkout: CheckoutSummary;
}

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

// "18 May 2099, 11:59 PM" from an India-time "2099-05-18T23:59:59".
function deadline(iso: string) {
  const [day, clock = "00:00"] = iso.split("T");
  return `${formatShortDate(day!)}, ${formatClock(clock)}`;
}

// The right-hand card: hotel, dates, guests, room and meal plan, cancellation
// terms and the itemised price (spec §4.4).
export default function BookingSummary({ checkout }: BookingSummaryProps) {
  const { hotel, stay, room, nights } = checkout;
  const guests = [plural(stay.adults, "adult"), stay.children > 0 && plural(stay.children, "child", "children")].filter(Boolean).join(", ");
  const time = (value: string | null, prefix: string) => (value ? ` · ${prefix} ${formatClock(value)}` : "");
  return (
    <Box component="aside" aria-label="Booking summary" sx={styles.root}>
      <Box sx={styles.hotel}>
        <Box sx={styles.photo}>
          <HotelPhoto src={hotel.imageUrl} alt={hotel.name} sizes="120px" />
        </Box>
        <Box sx={styles.hotelText}>
          <StarRating stars={hotel.starRating} />
          <Typography component="h2" sx={styles.name}>
            {hotel.name}
          </Typography>
          {hotel.address && <Typography sx={styles.address}>{hotel.address}</Typography>}
        </Box>
      </Box>
      <Divider />
      <Box sx={styles.facts}>
        <Typography sx={styles.fact}>
          <EventOutlined sx={styles.icon} />
          <span>
            <strong>{formatDayDate(stay.checkIn)}</strong> → <strong>{formatDayDate(stay.checkOut)}</strong> · {plural(nights, "night")}
            <Box component="span" sx={styles.times}>
              {time(hotel.checkIn.from, "check-in from")}
              {time(hotel.checkOut.until, "check-out by")}
            </Box>
          </span>
        </Typography>
        <Typography sx={styles.fact}>
          <PeopleOutlineRounded sx={styles.icon} />
          {guests}
          {stay.rooms > 1 ? ` · ${plural(stay.rooms, "room")}` : ""}
        </Typography>
        <Typography sx={[styles.fact, styles.strong]}>{room.roomName}</Typography>
        <Typography sx={[styles.fact, room.mealPlan ? styles.good : styles.muted]}>
          <FreeBreakfastOutlined sx={styles.icon} />
          {room.mealPlan ? (room.mealPlan === "Breakfast" ? "Breakfast included" : room.mealPlan) : "Room only"}
        </Typography>
        {room.freeCancellation ? (
          <Typography sx={[styles.fact, styles.good]}>
            <CheckRounded sx={styles.icon} />
            Free cancellation{room.freeCancellationUntil ? ` before ${deadline(room.freeCancellationUntil)}` : ""}
          </Typography>
        ) : (
          <Typography sx={[styles.fact, styles.muted]}>
            <InfoOutlined sx={styles.icon} />
            Non-refundable: no refund if you cancel or don&apos;t show up
          </Typography>
        )}
        {room.inclusions.map((inclusion) => (
          <Typography key={inclusion} sx={[styles.fact, styles.good]}>
            <CheckRounded sx={styles.icon} />
            {inclusion}
          </Typography>
        ))}
      </Box>
      <Divider />
      <PriceBreakdown room={room} nights={nights} rooms={stay.rooms} />
    </Box>
  );
}
