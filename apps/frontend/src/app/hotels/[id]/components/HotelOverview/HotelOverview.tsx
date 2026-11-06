"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { HotelDetails } from "@quickhotels/types/hotels";
import AmenityIcon from "@/components/hotel/AmenityIcon";
import { amenityLabel } from "@/config/hotelAmenities";
import { styles } from "./HotelOverview.styles";

interface HotelOverviewProps {
  hotel: HotelDetails;
}

// Sections shown before "Read more".
const SECTIONS_SHOWN = 1;

// The headline, the description (first section, then "Read more"), and the
// most popular facilities with icons.
export default function HotelOverview({ hotel }: HotelOverviewProps) {
  const [expanded, setExpanded] = useState(false);
  const sections = expanded ? hotel.description : hotel.description.slice(0, SECTIONS_SHOWN);
  return (
    <Box sx={styles.root}>
      <Box>
        {hotel.headline && (
          <Typography component="p" sx={styles.headline}>
            {hotel.headline}
          </Typography>
        )}
        {sections.map((section) => (
          <Box key={section.title} sx={styles.section}>
            {hotel.description.length > 1 && (
              <Typography component="h3" sx={styles.sectionTitle}>
                {section.title}
              </Typography>
            )}
            {section.paragraphs.map((paragraph, i) => (
              <Typography key={i} sx={styles.paragraph}>
                {paragraph}
              </Typography>
            ))}
          </Box>
        ))}
        {hotel.description.length > SECTIONS_SHOWN && (
          <Button onClick={() => setExpanded((open) => !open)} sx={styles.more}>
            {expanded ? "Show less" : "Read more"}
          </Button>
        )}
        {!hotel.headline && !hotel.description.length && (
          <Typography sx={styles.paragraph}>The hotel hasn&apos;t shared a description yet.</Typography>
        )}
      </Box>
      {hotel.amenities.length > 0 && (
        <Box sx={styles.highlights}>
          <Typography component="h3" sx={styles.sectionTitle}>
            Most popular facilities
          </Typography>
          <Box component="ul" sx={styles.list}>
            {hotel.amenities.slice(0, 8).map((amenity) => (
              <Box component="li" key={amenity} sx={styles.item}>
                <AmenityIcon amenity={amenity} sx={styles.icon} />
                {amenityLabel(amenity)}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
