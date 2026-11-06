"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { HotelSearchCriteria } from "@quickhotels/types/hotels";
import CardCarousel from "@/components/common/CardCarousel";
import { todayIso } from "@/lib/dates";
import { clearRecentSearches, readRecentSearches } from "@/lib/recentSearches";
import SectionHeader from "@/components/common/SectionHeader";
import RecentSearchCard from "./RecentSearchCard";
import { styles } from "./RecentSearches.styles";

// "Continue your search": the visitor's last searches from this browser.
// Hidden for first-time visitors and when every saved stay is in the past.
export default function RecentSearches() {
  const [searches, setSearches] = useState<HotelSearchCriteria[]>([]);

  // Storage only exists in the browser, so read it after the page loads.
  useEffect(() => {
    const today = todayIso();
    setSearches(readRecentSearches().filter((search) => search.checkIn >= today));
  }, []);

  if (!searches.length) return null;
  return (
    <Box component="section" aria-labelledby="recent-searches">
      <SectionHeader id="recent-searches" title="Continue your search" />
      <CardCarousel label="Your recent searches" itemWidth={{ xs: "78%", sm: "45%", md: "32%" }}>
        {searches.map((search) => (
          <RecentSearchCard key={`${search.destination}-${search.checkIn}-${search.checkOut}`} search={search} />
        ))}
      </CardCarousel>
      <Button
        size="small"
        onClick={() => {
          clearRecentSearches();
          setSearches([]);
        }}
        sx={styles.clear}
      >
        Clear recent searches
      </Button>
    </Box>
  );
}
