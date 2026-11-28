"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import CardCarousel from "@/components/common/CardCarousel";
import SectionHeader from "@/components/common/SectionHeader";
import { routes } from "@/config/navigation";
import type { Season } from "../../data/seasons";
import { styles } from "./SeasonalPicks.styles";

interface SeasonalPicksProps {
  season: Season;
}

const searchHref = (destination: string, area?: string) =>
  `${routes.hotels}?${new URLSearchParams(area ? { destination, name: area } : { destination })}`;

// "Best for winter": places that suit the time of year, each with popular
// areas that open the city's hotels already narrowed to that area.
export default function SeasonalPicks({ season }: SeasonalPicksProps) {
  return (
    <Box component="section" aria-labelledby="seasonal-picks">
      <SectionHeader
        id="seasonal-picks"
        title={`Best for ${season.label.toLowerCase()}`}
        subtitle={`Where to go in ${season.months}, and the areas travellers love`}
      />
      <CardCarousel label={`Places for ${season.label.toLowerCase()}`} itemWidth={{ xs: "78%", sm: "45%", md: "24%" }}>
        {season.picks.map((pick) => (
          <Box key={pick.destination} component="article" sx={styles.card}>
            <Box component={Link} href={searchHref(pick.destination)} sx={styles.media}>
              <Image src={pick.imageUrl} alt={pick.destination} fill sizes="(max-width: 600px) 78vw, (max-width: 900px) 45vw, 300px" style={{ objectFit: "cover" }} />
            </Box>
            <Box sx={styles.body}>
              <Typography component="h3" sx={styles.name}>
                <Box component={Link} href={searchHref(pick.destination)} sx={styles.nameLink}>
                  {pick.destination}
                </Box>
              </Typography>
              <Typography sx={styles.why}>{pick.why}</Typography>
              {pick.areas.length > 0 && (
                <Box sx={styles.areas} aria-label={`Popular areas in ${pick.destination}`}>
                  {pick.areas.map((area) => (
                    <Chip
                      key={area}
                      size="small"
                      icon={<PlaceOutlined />}
                      label={area}
                      component={Link}
                      href={searchHref(pick.destination, area)}
                      clickable
                      sx={styles.area}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </CardCarousel>
    </Box>
  );
}
