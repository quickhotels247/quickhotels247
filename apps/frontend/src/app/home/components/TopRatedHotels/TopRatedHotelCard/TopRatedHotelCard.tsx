"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import type { HotelSearchResult } from "@quickhotels/types/hotels";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import PriceTag from "@/components/hotel/PriceTag";
import StarRating from "@/components/hotel/StarRating";
import { hotelUrl } from "@/lib/hotelLinks";
import { styles } from "./TopRatedHotelCard.styles";

interface TopRatedHotelCardProps {
  hotel: HotelSearchResult;
  stay: { checkIn: string; checkOut: string };
}

// Photo on the left; name, stars, place and the live nightly price on the right.
export default function TopRatedHotelCard({ hotel, stay }: TopRatedHotelCardProps) {
  return (
    <Card sx={styles.card}>
      <CardActionArea component={Link} href={hotelUrl(hotel.id, stay)} sx={styles.action}>
        <Box sx={styles.media}>
          <HotelPhoto src={hotel.imageUrl} alt={hotel.name} sizes="(max-width: 600px) 40vw, 260px" />
        </Box>
        <Box sx={styles.body}>
          <Typography component="h3" sx={styles.name}>
            {hotel.name}
          </Typography>
          <StarRating stars={hotel.starRating} />
          <Typography sx={styles.location}>
            <PlaceOutlined sx={styles.locationIcon} aria-hidden="true" />
            {[hotel.city, hotel.country].filter(Boolean).join(", ")}
          </Typography>
          {hotel.freeCancellation && <Typography sx={styles.perk}>Free cancellation</Typography>}
          <Box sx={styles.footer}>
            <PriceTag price={hotel.pricePerNight} />
            <ArrowForwardRounded className="top-rated-arrow" sx={styles.arrow} aria-hidden="true" />
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
