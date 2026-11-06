"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import HotelRounded from "@mui/icons-material/HotelRounded";
import { styles } from "./HotelPhoto.styles";

interface HotelPhotoProps {
  src: string | null | undefined;
  alt: string;
  sizes: string;
}

// A hotel photo filling its (position: relative) parent. Supplier photos come
// from many hosts (TripJack: i.travelapi.com, pix8.agoda.net, bstatic.com…),
// so they're shown as-is rather than through Next's image optimiser, which
// only allows listed hosts. Shows a neutral placeholder when there's no photo.
export default function HotelPhoto({ src, alt, sizes }: HotelPhotoProps) {
  if (!src) {
    return (
      <Box sx={styles.placeholder} role="img" aria-label={alt}>
        <HotelRounded sx={styles.icon} />
      </Box>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} unoptimized style={{ objectFit: "cover" }} />;
}
