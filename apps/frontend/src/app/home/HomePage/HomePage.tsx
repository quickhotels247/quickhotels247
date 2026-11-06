import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import AccountBanner from "@/components/common/AccountBanner";
import ExploreIndia from "../components/ExploreIndia";
import HeroSection from "../components/HeroSection";
import OffersSection from "../components/OffersSection";
import PopularDestinations from "../components/PopularDestinations";
import PopularLinks from "../components/PopularLinks";
import PropertyTypes from "../components/PropertyTypes";
import RecentSearches from "../components/RecentSearches";
import TopRatedHotels from "../components/TopRatedHotels";
import TripPlanner from "../components/TripPlanner";
import TrustHighlights from "../components/TrustHighlights";
import WeekendDeals from "../components/WeekendDeals";
import { popularDestinations } from "../data/destinations";
import { indiaDestinations, tripThemes } from "../data/indiaDestinations";
import { sampleOffers } from "../data/offers";
import { popularLinkGroups } from "../data/popularLinks";
import { propertyTypes } from "../data/propertyTypes";
import { styles } from "./HomePage.styles";

// Home (spec §4.1), laid out like a large OTA home page: search first, then
// ways to browse (offers, places, property types, trip ideas), then hotels
// and deals (live TripJack prices from the backend), then sign-in, trust and
// SEO links. Every section hides itself when it has nothing to show.
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Container>
        <Stack sx={styles.sections}>
          <RecentSearches />
          <OffersSection offers={sampleOffers} />
          <PopularDestinations destinations={popularDestinations} />
          <ExploreIndia destinations={indiaDestinations} />
          <PropertyTypes types={propertyTypes} />
          <TripPlanner destinations={indiaDestinations} themes={tripThemes} />
          <WeekendDeals />
          <TopRatedHotels />
          <AccountBanner />
          <TrustHighlights />
          <PopularLinks groups={popularLinkGroups} />
        </Stack>
      </Container>
    </>
  );
}
