"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import type { Destination } from "@quickhotels/types/hotels";
import { routes } from "@/config/navigation";
import { formatCount } from "@/lib/format";
import { styles } from "./DestinationCard.styles";

interface DestinationCardProps {
  destination: Destination;
}

// City photo, name and number of hotels; opens hotel search for that city.
export default function DestinationCard({ destination }: DestinationCardProps) {
  const href = `${routes.hotels}?${new URLSearchParams({ destination: destination.name })}`;
  return (
    <Card sx={styles.card}>
      <CardActionArea component={Link} href={href} sx={styles.action}>
        <Box sx={styles.media}>
          <Image
            src={destination.imageUrl}
            alt={`${destination.name}, ${destination.country}`}
            fill
            sizes="(max-width: 600px) 45vw, (max-width: 900px) 30vw, 280px"
            style={{ objectFit: "cover" }}
          />
        </Box>
        <Box sx={styles.body}>
          <Typography component="h3" sx={styles.name}>
            {destination.name}
          </Typography>
          {destination.hotelCount ? (
            <Typography sx={styles.count}>{formatCount(destination.hotelCount)} hotels</Typography>
          ) : null}
        </Box>
      </CardActionArea>
    </Card>
  );
}
