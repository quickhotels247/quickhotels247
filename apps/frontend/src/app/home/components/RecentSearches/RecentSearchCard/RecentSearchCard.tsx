"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import type { HotelSearchCriteria } from "@quickhotels/types/hotels";
import { searchUrl } from "@/components/search/HotelSearchBar/searchCriteria";
import { formatShortDate } from "@/lib/dates";
import { styles } from "./RecentSearchCard.styles";

interface RecentSearchCardProps {
  search: HotelSearchCriteria;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export default function RecentSearchCard({ search }: RecentSearchCardProps) {
  const guests = plural(search.adults + search.children, "guest");
  return (
    <Card sx={styles.card}>
      <CardActionArea component={Link} href={searchUrl(search)} sx={styles.action}>
        <Box sx={styles.icon} aria-hidden="true">
          <HistoryRounded />
        </Box>
        <Box sx={styles.body}>
          <Typography component="h3" sx={styles.destination}>
            {search.destination}
          </Typography>
          <Typography sx={styles.details}>
            {formatShortDate(search.checkIn)} – {formatShortDate(search.checkOut)} · {guests}
            {search.rooms > 1 ? ` · ${plural(search.rooms, "room")}` : ""}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
