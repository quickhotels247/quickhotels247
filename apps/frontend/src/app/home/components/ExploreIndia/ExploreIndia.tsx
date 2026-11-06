"use client";

import Box from "@mui/material/Box";
import CardCarousel from "@/components/common/CardCarousel";
import { routes } from "@/config/navigation";
import type { IndiaDestination } from "../../data/types";
import SectionHeader from "@/components/common/SectionHeader";
import { useDestinationStats } from "../../hooks/useDestinationStats";
import IndiaDestinationCard from "./IndiaDestinationCard";

interface ExploreIndiaProps {
  destinations: IndiaDestination[];
}

// Swipeable row of Indian cities and regions with hotel counts.
export default function ExploreIndia({ destinations: list }: ExploreIndiaProps) {
  const destinations = useDestinationStats(list);
  if (!destinations.length) return null;
  return (
    <Box component="section" aria-labelledby="explore-india">
      <SectionHeader
        id="explore-india"
        title="Explore India"
        subtitle="Popular places to stay across the country"
        viewAllHref={routes.hotels}
      />
      <CardCarousel label="Destinations in India" itemWidth={{ xs: "42%", sm: "28%", md: "18.5%" }}>
        {destinations.map((destination) => (
          <IndiaDestinationCard key={destination.id} destination={destination} />
        ))}
      </CardCarousel>
    </Box>
  );
}
