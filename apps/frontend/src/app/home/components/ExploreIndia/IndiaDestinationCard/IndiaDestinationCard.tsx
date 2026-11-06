"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import { formatCount } from "@/lib/format";
import type { IndiaDestination } from "../../../data/types";
import { styles } from "./IndiaDestinationCard.styles";

interface IndiaDestinationCardProps {
  destination: IndiaDestination;
}

// Square photo with the place name and number of hotels below.
export default function IndiaDestinationCard({ destination }: IndiaDestinationCardProps) {
  const href = `${routes.hotels}?${new URLSearchParams({ destination: destination.name })}`;
  return (
    <Box component={Link} href={href} sx={styles.root}>
      <Box sx={styles.media}>
        <Image
          src={destination.imageUrl}
          alt={`${destination.name}, ${destination.state}`}
          fill
          sizes="(max-width: 600px) 42vw, (max-width: 900px) 28vw, 220px"
          style={{ objectFit: "cover" }}
        />
      </Box>
      <Typography component="h3" sx={styles.name}>
        {destination.name}
      </Typography>
      {destination.hotelCount ? (
        <Typography sx={styles.count}>{formatCount(destination.hotelCount)} properties</Typography>
      ) : null}
    </Box>
  );
}
