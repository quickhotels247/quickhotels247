import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import FreeBreakfastOutlined from "@mui/icons-material/FreeBreakfastOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import type { HotelSearchCriteria, HotelSearchResult, SearchCentre } from "@quickhotels/types/hotels";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import SaveHotelButton from "@/components/hotel/SaveHotelButton";
import StarRating from "@/components/hotel/StarRating";
import { formatPrice } from "@/lib/format";
import { hotelUrl } from "@/lib/hotelLinks";
import { AMENITY_LABELS } from "@/config/hotelAmenities";
import { styles } from "./HotelResultCard.styles";

interface HotelResultCardProps {
  hotel: HotelSearchResult;
  criteria: HotelSearchCriteria;
  nights: number;
  centre: SearchCentre | null;
  searchId: string;
}

const FACILITIES_SHOWN = 4;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// One hotel in the results: photo, name, stars, place, what the cheapest rate
// includes, and the price for the whole stay (spec §4.2: say what it covers).
export default function HotelResultCard({ hotel, criteria, nights, centre, searchId }: HotelResultCardProps) {
  const href = hotelUrl(hotel.id, criteria, searchId);
  const guests = [
    plural(criteria.adults, "adult"),
    criteria.children > 0 && (criteria.children === 1 ? "1 child" : `${criteria.children} children`),
  ]
    .filter(Boolean)
    .join(", ");
  const place = hotel.address ?? [hotel.city, hotel.country].filter(Boolean).join(", ");
  // The most asked-for facilities first, a few at most.
  const distance =
    centre && hotel.distanceKm != null
      ? `${hotel.distanceKm < 1 ? `${Math.round(hotel.distanceKm * 1000)} m` : `${hotel.distanceKm} km`} from ${centre.kind === "landmark" ? centre.name : "centre"}`
      : null;
  const facilities = AMENITY_LABELS.filter(({ id }) => hotel.amenities?.includes(id)).slice(0, FACILITIES_SHOWN);

  return (
    <Card component="article" sx={styles.card}>
      <Box component={Link} href={href} sx={styles.media} tabIndex={-1} aria-hidden="true">
        <HotelPhoto src={hotel.imageUrl} alt="" sizes="(max-width: 600px) 34vw, 240px" />
      </Box>
      <Box sx={styles.heart}>
        <SaveHotelButton
          hotelId={hotel.id}
          hotel={{ name: hotel.name, city: hotel.city || null, country: hotel.country || null, imageUrl: hotel.imageUrl || null, starRating: hotel.starRating }}
        />
      </Box>

      <Box sx={styles.body}>
        <Box sx={styles.heading}>
          <Typography component="h2" sx={styles.name}>
            <Box component={Link} href={href} sx={styles.nameLink}>
              {hotel.name}
            </Box>
          </Typography>
          <Box sx={styles.badges}>
            <StarRating stars={hotel.starRating} />
            {hotel.propertyType && <Chip label={hotel.propertyType} size="small" variant="outlined" sx={styles.type} />}
          </Box>
        </Box>
        {place && (
          <Typography sx={styles.place}>
            <PlaceOutlined sx={styles.placeIcon} aria-hidden="true" />
            <Box component="span" sx={styles.placeText}>{place}</Box>
          </Typography>
        )}
        {distance && <Typography sx={styles.distance}>{distance}</Typography>}
        {facilities.length > 0 && (
          <Typography sx={styles.facilities}>{facilities.map(({ label }) => label).join(" · ")}</Typography>
        )}
        <Box sx={styles.perks}>
          {hotel.mealPlan && (
            <Typography sx={styles.perk}>
              <FreeBreakfastOutlined sx={styles.perkIcon} aria-hidden="true" />
              {hotel.mealPlan}
            </Typography>
          )}
          {hotel.freeCancellation && (
            <Typography sx={styles.perk}>
              <CheckRounded sx={styles.perkIcon} aria-hidden="true" />
              Free cancellation
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={styles.pricing}>
        <Typography sx={styles.stay}>
          {plural(nights, "night")}, {guests}
          {criteria.rooms > 1 ? `, ${plural(criteria.rooms, "room")}` : ""}
        </Typography>
        <Typography sx={styles.total}>{formatPrice(hotel.totalPrice)}</Typography>
        <Typography sx={styles.perNight}>
          {formatPrice(hotel.pricePerNight)} per night{hotel.taxesIncluded ? " · incl. taxes & fees" : ""}
        </Typography>
        <Button component={Link} href={href} variant="contained" endIcon={<ChevronRightRounded />} sx={styles.cta}>
          See availability
        </Button>
      </Box>
    </Card>
  );
}
