import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import AccountBanner from "@/components/common/AccountBanner";
import ExploreByCountry from "../components/ExploreByCountry";
import FlightsFaq from "../components/FlightsFaq";
import FlightsHero from "../components/FlightsHero";
import PopularRoutes from "../components/PopularRoutes";
import TopFlightLinks from "../components/TopFlightLinks";
import WhyBookFlights from "../components/WhyBookFlights";
import { flightCountries } from "../data/countries";
import { flightFaqs } from "../data/faq";
import { popularRoutes } from "../data/popularRoutes";
import { topFlightLinkGroups } from "../data/topFlightLinks";
import { styles } from "./FlightsPage.styles";

// Flights landing page, in Booking.com's order: search, explore by country,
// popular flights, sign-in, why book with us, top flights from India, FAQ.
// The flight search itself arrives with TripJack's flights API (roadmap F2–F3).
export default function FlightsPage() {
  return (
    <>
      <FlightsHero />
      <Container>
        <Stack sx={styles.sections}>
          <ExploreByCountry countries={flightCountries} />
          <PopularRoutes routes={popularRoutes} />
          <AccountBanner />
          <WhyBookFlights />
          <TopFlightLinks groups={topFlightLinkGroups} />
          <FlightsFaq faqs={flightFaqs} />
        </Stack>
      </Container>
    </>
  );
}
