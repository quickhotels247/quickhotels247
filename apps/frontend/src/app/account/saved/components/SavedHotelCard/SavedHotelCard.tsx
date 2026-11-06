import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SavedHotel } from "@quickhotels/types/wishlist";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import SaveHotelButton from "@/components/hotel/SaveHotelButton";
import StarRating from "@/components/hotel/StarRating";
import { styles } from "./SavedHotelCard.styles";

// One saved hotel: photo, name, stars and place; the heart removes it.
export default function SavedHotelCard({ hotel }: { hotel: SavedHotel }) {
  const href = `/hotels/${hotel.hotelId}`;
  const place = [hotel.city, hotel.country].filter(Boolean).join(", ");
  return (
    <Box component="article" sx={styles.root}>
      <Box sx={styles.media}>
        <Box component={Link} href={href} tabIndex={-1} aria-hidden="true" sx={styles.photoLink}>
          <HotelPhoto src={hotel.imageUrl ?? ""} alt="" sizes="(max-width: 600px) 100vw, 300px" />
        </Box>
        <Box sx={styles.heart}>
          <SaveHotelButton hotelId={hotel.hotelId} hotel={hotel} />
        </Box>
      </Box>
      <Box sx={styles.body}>
        <Typography component="h2" sx={styles.name}>
          <Box component={Link} href={href} sx={styles.nameLink}>
            {hotel.name}
          </Box>
        </Typography>
        <StarRating stars={hotel.starRating} />
        {place && <Typography sx={styles.place}>{place}</Typography>}
      </Box>
    </Box>
  );
}
