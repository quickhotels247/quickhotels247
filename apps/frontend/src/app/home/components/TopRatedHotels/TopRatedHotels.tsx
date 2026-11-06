"use client";

import Box from "@mui/material/Box";
import CardSkeletonRow from "@/components/common/CardSkeletonRow";
import SectionHeader from "@/components/common/SectionHeader";
import { routes } from "@/config/navigation";
import { homeApi } from "@/lib/api/home";
import { formatShortDate } from "@/lib/dates";
import { useApiData } from "@/lib/hooks/useApiData";
import TopRatedHotelCard from "./TopRatedHotelCard";
import { styles } from "./TopRatedHotels.styles";

// The best-rated hotel in each featured destination, with live prices for one
// night two weeks out (GET /api/v1/home/top-hotels). Hidden if prices can't load.
export default function TopRatedHotels() {
  const { data, loading } = useApiData((signal) => homeApi.topHotels(signal));
  if (!loading && !data?.hotels.length) return null;

  return (
    <Box component="section" aria-labelledby="top-rated-hotels">
      <SectionHeader
        id="top-rated-hotels"
        title="Top Rated Hotels"
        subtitle={data ? `Prices for ${formatShortDate(data.checkIn)}, 1 night, 2 adults` : undefined}
        viewAllHref={routes.hotels}
      />
      {loading || !data ? (
        <CardSkeletonRow label="Loading top rated hotels" count={4} aspectRatio="3 / 2" />
      ) : (
        <Box component="ul" sx={styles.list}>
          {data.hotels.map((hotel) => (
            <Box component="li" key={hotel.id}>
              <TopRatedHotelCard hotel={hotel} stay={{ checkIn: data.checkIn, checkOut: data.checkOut }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
