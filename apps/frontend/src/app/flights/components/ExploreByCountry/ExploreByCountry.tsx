import Box from "@mui/material/Box";
import CardCarousel from "@/components/common/CardCarousel";
import SectionHeader from "@/components/common/SectionHeader";
import type { FlightCountry } from "../../data/types";
import AnywhereCard from "./AnywhereCard";
import CountryCard from "./CountryCard";

interface ExploreByCountryProps {
  countries: FlightCountry[];
}

// Tall photo tiles with the country's flag, ending in an "Anywhere" card.
export default function ExploreByCountry({ countries }: ExploreByCountryProps) {
  if (!countries.length) return null;
  return (
    <Box component="section" aria-labelledby="explore-by-country">
      <SectionHeader id="explore-by-country" title="Explore by country" subtitle="Discover trending destinations, just a flight away" />
      <CardCarousel label="Countries" itemWidth={{ xs: "62%", sm: "36%", md: "23.5%" }}>
        {[
          ...countries.map((country) => <CountryCard key={country.id} country={country} />),
          <AnywhereCard key="anywhere" />,
        ]}
      </CardCarousel>
    </Box>
  );
}
