import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import FlightSearchBar from "@/components/search/FlightSearchBar";
import { flightImages } from "../../data/images";
import { styles } from "./FlightsHero.styles";

// Sky photo with the headline and the flight search bar.
export default function FlightsHero() {
  return (
    <Container sx={styles.outer}>
      <Box component="section" aria-labelledby="flights-hero-title" sx={styles.root}>
        <Image src={flightImages.hero} alt="" fill priority sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: "cover" }} />
        <Box sx={styles.shade} aria-hidden="true" />
        <Box sx={styles.content}>
          <Typography id="flights-hero-title" variant="h1" sx={styles.title}>
            Compare and book flights with ease
          </Typography>
          <Typography sx={styles.subtitle}>Discover your next destination, in India and around the world.</Typography>
          <Box sx={styles.search}>
            <FlightSearchBar />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
