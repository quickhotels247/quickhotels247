"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import type { HotelImage } from "@quickhotels/types/hotels";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import GalleryDialog from "./GalleryDialog";
import { styles } from "./PhotoGallery.styles";

interface PhotoGalleryProps {
  images: HotelImage[];
  hotelName: string;
}

// One large photo and four small ones (one on phones); any opens the full gallery.
export default function PhotoGallery({ images, hotelName }: PhotoGalleryProps) {
  // The photo open in the gallery; null while it's closed.
  const [open, setOpen] = useState<number | null>(null);
  const shown = images.slice(0, 5);
  const alt = (index: number) => images[index]?.caption ?? `${hotelName}, photo ${index + 1}`;

  if (!images.length) {
    return (
      <Box sx={[styles.grid, styles.single]}>
        <Box sx={styles.tile}>
          <HotelPhoto src={null} alt={hotelName} sizes="100vw" />
        </Box>
      </Box>
    );
  }
  return (
    <>
      <Box sx={[styles.grid, shown.length === 1 && styles.single]}>
        {shown.map((image, index) => (
          <ButtonBase
            key={image.url}
            onClick={() => setOpen(index)}
            aria-label={`Open photo ${index + 1} of ${images.length}`}
            sx={[styles.tile, index === 0 ? styles.main : styles.small]}
          >
            <HotelPhoto src={image.url} alt={alt(index)} sizes={index === 0 ? "(max-width: 900px) 100vw, 60vw" : "20vw"} />
            {index === shown.length - 1 && images.length > shown.length && (
              <Box sx={styles.more} aria-hidden="true">
                +{images.length - shown.length} photos
              </Box>
            )}
          </ButtonBase>
        ))}
        <ButtonBase onClick={() => setOpen(0)} sx={styles.allButton}>
          <PhotoLibraryOutlined fontSize="small" />
          {images.length} photos
        </ButtonBase>
      </Box>
      <GalleryDialog images={images} hotelName={hotelName} index={open} onIndexChange={setOpen} />
    </>
  );
}
