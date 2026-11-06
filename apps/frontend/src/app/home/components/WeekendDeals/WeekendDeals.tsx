"use client";

import Box from "@mui/material/Box";
import CardCarousel from "@/components/common/CardCarousel";
import CardSkeletonRow from "@/components/common/CardSkeletonRow";
import SectionHeader from "@/components/common/SectionHeader";
import { homeApi } from "@/lib/api/home";
import { formatShortDate } from "@/lib/dates";
import { useApiData } from "@/lib/hooks/useApiData";
import WeekendDealCard from "./WeekendDealCard";

// "Deals for the weekend": the cheapest well-rated stay in each featured
// destination for the coming Friday–Sunday, priced live
// (GET /api/v1/home/weekend-deals). Hidden if prices can't load.
export default function WeekendDeals() {
  const { data, loading } = useApiData((signal) => homeApi.weekendDeals(signal));
  if (!loading && !data?.hotels.length) return null;

  const subtitle = data
    ? `Stays for ${formatShortDate(data.checkIn)} – ${formatShortDate(data.checkOut)}, 2 adults`
    : "Stays for the coming weekend";
  return (
    <Box component="section" aria-labelledby="weekend-deals">
      <SectionHeader id="weekend-deals" title="Deals for the weekend" subtitle={subtitle} />
      {loading || !data ? (
        <CardSkeletonRow label="Loading weekend deals" />
      ) : (
        <CardCarousel label="Weekend stays" itemWidth={{ xs: "72%", sm: "40%", md: "23.5%" }}>
          {data.hotels.map((hotel) => (
            <WeekendDealCard key={hotel.id} hotel={hotel} stay={{ checkIn: data.checkIn, checkOut: data.checkOut }} nights={data.nights} />
          ))}
        </CardCarousel>
      )}
    </Box>
  );
}
