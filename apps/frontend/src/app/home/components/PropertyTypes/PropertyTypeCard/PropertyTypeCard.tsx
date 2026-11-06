"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import type { PropertyType } from "../../../data/types";
import { styles } from "./PropertyTypeCard.styles";

interface PropertyTypeCardProps {
  type: PropertyType;
}

export default function PropertyTypeCard({ type }: PropertyTypeCardProps) {
  const href = `${routes.hotels}?${new URLSearchParams({ propertyType: type.id })}`;
  return (
    <Box component={Link} href={href} sx={styles.root}>
      <Box sx={styles.media}>
        <Image src={type.imageUrl} alt="" fill sizes="(max-width: 600px) 58vw, 240px" style={{ objectFit: "cover" }} />
      </Box>
      <Typography component="h3" sx={styles.label}>
        {type.label}
      </Typography>
    </Box>
  );
}
