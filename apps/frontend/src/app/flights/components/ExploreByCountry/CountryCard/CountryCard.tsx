"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import type { FlightCountry } from "../../../data/types";
import { styles } from "./CountryCard.styles";

interface CountryCardProps {
  country: FlightCountry;
}

export default function CountryCard({ country }: CountryCardProps) {
  const href = `${routes.flightSearch}?${new URLSearchParams({ tripType: "roundTrip", to: country.mainAirport })}`;
  return (
    <Box component={Link} href={href} sx={styles.root}>
      <Image src={country.imageUrl} alt="" fill sizes="(max-width: 600px) 62vw, 290px" style={{ objectFit: "cover" }} />
      <Box sx={styles.shade} aria-hidden="true" />
      <Box sx={styles.label}>
        {/* Small flag from flagcdn.com; decorative, the name is the text. */}
        <Box component="img" src={`https://flagcdn.com/${country.flagCode}.svg`} alt="" sx={styles.flag} />
        <Typography component="h3" sx={styles.name}>
          {country.name}
        </Typography>
      </Box>
    </Box>
  );
}
