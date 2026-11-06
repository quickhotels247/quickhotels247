"use client";

import Box from "@mui/material/Box";
import type { Destination } from "@quickhotels/types/hotels";
import SectionHeader from "@/components/common/SectionHeader";
import { routes } from "@/config/navigation";
import { useDestinationStats } from "../../hooks/useDestinationStats";
import DestinationCard from "./DestinationCard";
import { styles } from "./PopularDestinations.styles";

interface PopularDestinationsProps {
  destinations: Destination[];
}

// Swipeable row on phones, a four-column grid from desktop up.
export default function PopularDestinations({ destinations: list }: PopularDestinationsProps) {
  const destinations = useDestinationStats(list);
  if (!destinations.length) return null;
  return (
    <Box component="section" aria-labelledby="popular-destinations">
      <SectionHeader id="popular-destinations" title="Popular Destinations" viewAllHref={routes.hotels} />
      <Box component="ul" sx={styles.list}>
        {destinations.map((destination) => (
          <Box component="li" key={destination.id} sx={styles.item}>
            <DestinationCard destination={destination} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
