import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import HotelSearchBar from "@/components/search/HotelSearchBar";
import { homeImages } from "../../data/images";
import { styles } from "./HeroSection.styles";

// Full-width photo with the headline and the hotel search bar on top.
export default function HeroSection() {
  return (
    <Container sx={styles.outer}>
      <Box component="section" aria-labelledby="hero-title" sx={styles.root}>
        <Image
          src={homeImages.hero}
          alt=""
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          style={{ objectFit: "cover" }}
        />
        <Box sx={styles.shade} aria-hidden="true" />
        <Box sx={styles.content}>
          <Typography id="hero-title" variant="h1" sx={styles.title}>
            Find Your Perfect Stay
            <br />
            Anywhere, Anytime
          </Typography>
          <Typography sx={styles.subtitle}>Book smarter, Travel better.</Typography>
          <Box sx={styles.search}>
            <HotelSearchBar />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
