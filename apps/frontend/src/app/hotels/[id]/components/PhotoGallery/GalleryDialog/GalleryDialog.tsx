"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import type { HotelImage } from "@quickhotels/types/hotels";
import { styles } from "./GalleryDialog.styles";

interface GalleryDialogProps {
  images: HotelImage[];
  hotelName: string;
  // The photo shown; null closes the gallery.
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

// Full-screen photos with previous/next (buttons and arrow keys) and thumbnails.
export default function GalleryDialog({ images, hotelName, index, onIndexChange }: GalleryDialogProps) {
  const open = index !== null;
  const current = index ?? 0;
  const go = (step: number) => onIndexChange((current + step + images.length) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const image = images[current];
  return (
    <Dialog open={open} onClose={() => onIndexChange(null)} fullScreen aria-label={`${hotelName} photos`} slotProps={{ paper: { sx: styles.paper } }}>
      <Box sx={styles.top}>
        <Typography sx={styles.title}>{hotelName}</Typography>
        <Typography sx={styles.count}>
          {current + 1} / {images.length}
        </Typography>
        <IconButton onClick={() => onIndexChange(null)} aria-label="Close photos" sx={styles.control}>
          <CloseRounded />
        </IconButton>
      </Box>
      <Box sx={styles.stage}>
        <IconButton onClick={() => go(-1)} aria-label="Previous photo" sx={[styles.control, styles.nav]}>
          <ChevronLeftRounded fontSize="large" />
        </IconButton>
        {image && (
          // Supplier photos come from many hosts; shown as-is (see HotelPhoto).
          // eslint-disable-next-line @next/next/no-img-element
          <Box component="img" src={image.url} alt={image.caption ?? `${hotelName}, photo ${current + 1}`} sx={styles.photo} />
        )}
        <IconButton onClick={() => go(1)} aria-label="Next photo" sx={[styles.control, styles.nav]}>
          <ChevronRightRounded fontSize="large" />
        </IconButton>
      </Box>
      {image?.caption && <Typography sx={styles.caption}>{image.caption}</Typography>}
      <Box sx={styles.thumbs} role="list" aria-label="All photos">
        {images.map((thumb, i) => (
          <Box
            key={thumb.url}
            component="button"
            role="listitem"
            onClick={() => onIndexChange(i)}
            aria-label={`Photo ${i + 1}`}
            aria-current={i === current}
            sx={[styles.thumb, i === current && styles.thumbActive]}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.url} alt="" loading="lazy" />
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}
