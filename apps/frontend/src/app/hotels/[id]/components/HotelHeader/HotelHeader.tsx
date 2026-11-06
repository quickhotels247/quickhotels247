import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import type { HotelDetails, Money } from "@quickhotels/types/hotels";
import SaveHotelButton from "@/components/hotel/SaveHotelButton";
import StarRating from "@/components/hotel/StarRating";
import { formatPrice } from "@/lib/format";
import { styles } from "./HotelHeader.styles";

interface HotelHeaderProps {
  hotel: HotelDetails;
  // The cheapest rate for the stay, once rooms have loaded.
  fromPrice: Money | null;
  roomsLoading: boolean;
  onReserve: () => void;
}

const mapsUrl = (hotel: HotelDetails) =>
  hotel.latitude !== null && hotel.longitude !== null
    ? `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([hotel.name, hotel.address].filter(Boolean).join(", "))}`;

// Name, stars, type and address; the lowest price and "Reserve" on the right.
export default function HotelHeader({ hotel, fromPrice, roomsLoading, onReserve }: HotelHeaderProps) {
  return (
    <Box sx={styles.root}>
      <Box sx={styles.main}>
        <Box sx={styles.badges}>
          {hotel.propertyType && <Chip label={hotel.propertyType} size="small" sx={styles.type} />}
          <StarRating stars={hotel.starRating} />
        </Box>
        <Box sx={styles.titleRow}>
          <Typography component="h1" sx={styles.name}>
            {hotel.name}
          </Typography>
          <SaveHotelButton
            variant="plain"
            hotelId={hotel.id}
            hotel={{ name: hotel.name, city: hotel.city, country: hotel.country, imageUrl: hotel.images[0]?.url ?? null, starRating: hotel.starRating }}
          />
        </Box>
        {hotel.address && (
          <Typography sx={styles.address}>
            <PlaceOutlined sx={styles.addressIcon} aria-hidden="true" />
            <span>
              {hotel.address}{" "}
              <Link href={mapsUrl(hotel)} target="_blank" rel="noopener noreferrer" sx={styles.mapLink}>
                Show on map
              </Link>
            </span>
          </Typography>
        )}
      </Box>
      <Box sx={styles.side}>
        {roomsLoading ? (
          <Skeleton width={140} height={32} />
        ) : fromPrice ? (
          <Typography sx={styles.from}>
            from <Box component="span" sx={styles.amount}>{formatPrice(fromPrice)}</Box>
          </Typography>
        ) : null}
        <Button variant="contained" size="large" onClick={onReserve} sx={styles.reserve}>
          {fromPrice || roomsLoading ? "See rooms" : "Check availability"}
        </Button>
      </Box>
    </Box>
  );
}
