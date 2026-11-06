"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { Offer } from "../../../data/types";
import { styles } from "./OfferCard.styles";

interface OfferCardProps {
  offer: Offer;
}

// Text and button on the left, photo on the right (stacked on small phones).
export default function OfferCard({ offer }: OfferCardProps) {
  return (
    <Card sx={styles.card}>
      <Box sx={styles.body}>
        <Typography component="h3" sx={styles.title}>
          {offer.title}
        </Typography>
        <Typography sx={styles.description}>{offer.description}</Typography>
        <Button component={Link} href={offer.href} variant="contained" sx={styles.cta}>
          {offer.ctaLabel}
        </Button>
      </Box>
      <Box sx={styles.media}>
        <Image src={offer.imageUrl} alt="" fill sizes="(max-width: 600px) 100vw, 280px" style={{ objectFit: "cover" }} />
      </Box>
    </Card>
  );
}
