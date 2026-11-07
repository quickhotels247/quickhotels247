"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import JsonLd from "@/components/seo/JsonLd";
import HotelSearchBar from "@/components/search/HotelSearchBar";
import { emptyCriteria } from "@/components/search/HotelSearchBar/searchCriteria";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { CITY_PAGES, type CityPage } from "../data/cities";
import { styles } from "./CityLandingPage.styles";

const POINTS = [
  "Live prices for your dates, with taxes shown before you book",
  "Filter by free cancellation, meals, stars and distance",
  "Clear cancellation terms saved with every booking",
];

// "Hotels in Goa": a search bar set to the place, why book here, and links to
// other places. Prices always come from a live search.
export default function CityLandingPage({ city }: { city: CityPage }) {
  const place = city.region ? `${city.name}, ${city.region}` : city.name;
  const others = CITY_PAGES.filter((other) => other.slug !== city.slug && other.group === city.group);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
            { "@type": "ListItem", position: 2, name: `Hotels in ${city.name}`, item: `${SITE_URL}/hotels/in/${city.slug}` },
          ],
        }}
      />
      <Box sx={[styles.band, city.imageUrl ? styles.photo(city.imageUrl) : styles.plain]}>
        <Container>
          <Typography component="h1" sx={styles.title}>
            Hotels in {city.name}
          </Typography>
          <Typography sx={styles.subtitle}>
            {place === city.name ? city.country : `${place}, ${city.country}`} · {city.blurb}
          </Typography>
          <Box sx={styles.search}>
            <HotelSearchBar initialCriteria={{ ...emptyCriteria, destination: `${city.name}, ${city.country}` }} />
          </Box>
        </Container>
      </Box>
      <Container sx={styles.body}>
        <Box component="section" aria-labelledby="why-title">
          <Typography component="h2" id="why-title" sx={styles.h2}>
            Book your stay in {city.name}
          </Typography>
          <Typography sx={styles.text}>
            Choose your dates and guests above to see hotels in {city.name} with live room prices. Compare by price, rating, distance and what each rate includes, then book in a few steps.
          </Typography>
          <Box component="ul" sx={styles.points}>
            {POINTS.map((point) => (
              <Box component="li" key={point} sx={styles.point}>
                <CheckCircleOutlineRounded color="success" fontSize="small" />
                {point}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="nav" aria-labelledby="more-title">
          <Typography component="h2" id="more-title" sx={styles.h2}>
            {city.group === "india" ? "More places in India" : "More destinations abroad"}
          </Typography>
          <Box sx={styles.links}>
            {others.map((other) => (
              <Box key={other.slug} component={Link} href={`/hotels/in/${other.slug}`} sx={styles.link}>
                Hotels in {other.name}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </>
  );
}
