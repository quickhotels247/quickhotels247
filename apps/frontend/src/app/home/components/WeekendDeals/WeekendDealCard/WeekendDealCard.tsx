"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import type { HotelSearchResult } from "@quickhotels/types/hotels";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import PriceTag from "@/components/hotel/PriceTag";
import SaveHotelButton from "@/components/hotel/SaveHotelButton";
import StarRating from "@/components/hotel/StarRating";
import { hotelUrl } from "@/lib/hotelLinks";
import { styles } from "./WeekendDealCard.styles";

interface WeekendDealCardProps {
  hotel: HotelSearchResult;
  stay: { checkIn: string; checkOut: string };
  nights: number;
}

// Photo on top; name, stars, place and the live total for the weekend below.
export default function WeekendDealCard({ hotel, stay, nights }: WeekendDealCardProps) {
  return (
    <Card sx={styles.card}>
      <CardActionArea component={Link} href={hotelUrl(hotel.id, stay)} sx={styles.action}>
        <Box sx={styles.media}>
          <HotelPhoto src={hotel.imageUrl} alt={hotel.name} sizes="(max-width: 600px) 72vw, 290px" />
        </Box>
        <Box sx={styles.body}>
          <Typography component="h3" sx={styles.name}>
            {hotel.name}
          </Typography>
          <Typography sx={styles.location}>
            <PlaceOutlined sx={styles.locationIcon} aria-hidden="true" />
            {[hotel.city, hotel.country].filter(Boolean).join(", ")}
          </Typography>
          <StarRating stars={hotel.starRating} />
          <Box sx={styles.price}>
            <PriceTag price={hotel.totalPrice} unit={`${nights} night${nights === 1 ? "" : "s"}`} />
            <Typography sx={styles.taxes}>{hotel.taxesIncluded ? "Taxes and fees included" : "Before taxes and fees"}</Typography>
          </Box>
        </Box>
      </CardActionArea>
      {/* Outside the link: a button can't sit inside one. */}
      <Box sx={styles.heart}>
        <SaveHotelButton
          hotelId={hotel.id}
          hotel={{ name: hotel.name, city: hotel.city || null, country: hotel.country || null, imageUrl: hotel.imageUrl || null, starRating: hotel.starRating }}
        />
      </Box>
    </Card>
  );
}
