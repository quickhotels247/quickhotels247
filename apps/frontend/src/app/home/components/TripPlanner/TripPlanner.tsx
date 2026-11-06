"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import CardCarousel from "@/components/common/CardCarousel";
import type { IndiaDestination, TripTheme } from "../../data/types";
import SectionHeader from "@/components/common/SectionHeader";
import TripDestinationCard from "./TripDestinationCard";
import { styles } from "./TripPlanner.styles";

interface TripPlannerProps {
  destinations: IndiaDestination[];
  themes: { id: TripTheme; label: string }[];
}

// "Quick and easy trip planner": pick a kind of trip, see places that fit it.
export default function TripPlanner({ destinations, themes }: TripPlannerProps) {
  const [theme, setTheme] = useState<TripTheme>(themes[0]?.id ?? "beaches");
  const matching = destinations.filter((destination) => destination.themes.includes(theme));
  if (!themes.length) return null;

  return (
    <Box component="section" aria-labelledby="trip-planner">
      <SectionHeader id="trip-planner" title="Quick and easy trip planner" subtitle="Pick a vibe and explore the top places for it" />
      <Tabs
        value={theme}
        onChange={(_, value: TripTheme) => setTheme(value)}
        variant="scrollable"
        scrollButtons={false}
        aria-label="Kind of trip"
        sx={styles.tabs}
      >
        {themes.map((item) => (
          <Tab key={item.id} value={item.id} label={item.label} id={`trip-tab-${item.id}`} aria-controls="trip-panel" sx={styles.tab} />
        ))}
      </Tabs>
      <Box id="trip-panel" role="tabpanel" aria-labelledby={`trip-tab-${theme}`} sx={styles.panel}>
        <CardCarousel key={theme} label="Places for this kind of trip" itemWidth={{ xs: "62%", sm: "36%", md: "24%" }}>
          {matching.map((destination) => (
            <TripDestinationCard key={destination.id} destination={destination} />
          ))}
        </CardCarousel>
      </Box>
    </Box>
  );
}
