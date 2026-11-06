"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import CardCarousel from "@/components/common/CardCarousel";
import SectionHeader from "@/components/common/SectionHeader";
import { flightsApi } from "@/lib/api/flights";
import { useApiData } from "@/lib/hooks/useApiData";
import type { PopularRoute } from "../../data/types";
import RouteCard from "./RouteCard";
import { styles } from "./PopularRoutes.styles";

interface PopularRoutesProps {
  routes: PopularRoute[];
}

type Scope = PopularRoute["scope"];
const scopes: { id: Scope; label: string }[] = [
  { id: "international", label: "International" },
  { id: "domestic", label: "Domestic" },
];

// The backend fetches fares in the background, so right after it starts some
// routes have none yet. Check again a few times until they all arrive.
const RECHECK_MS = 20_000;
const MAX_CHECKS = 4;

// "Popular flights near you": International / Domestic tabs of route cards
// with the cheapest live round-trip fare for each.
export default function PopularRoutes({ routes }: PopularRoutesProps) {
  const [scope, setScope] = useState<Scope>("international");
  const [check, setCheck] = useState(1);
  const { data: fares, loading } = useApiData((signal) => flightsApi.popularRoutes(signal), [check]);

  const missing = !loading && fares !== null && fares.length < routes.length;
  useEffect(() => {
    if (!missing || check >= MAX_CHECKS) return;
    const timer = setTimeout(() => setCheck((n) => n + 1), RECHECK_MS);
    return () => clearTimeout(timer);
  }, [missing, check]);
  // Still waiting while a fare could yet arrive; after that the card offers a search instead.
  const pending = loading || (missing && check < MAX_CHECKS);

  const shown = routes.filter((route) => route.scope === scope);
  if (!routes.length) return null;
  return (
    <Box component="section" aria-labelledby="popular-routes">
      <SectionHeader id="popular-routes" title="Popular flights near you" subtitle="Find deals on domestic and international flights" />
      <Tabs value={scope} onChange={(_, value: Scope) => setScope(value)} aria-label="Kind of flight" sx={styles.tabs}>
        {scopes.map((item) => (
          <Tab key={item.id} value={item.id} label={item.label} id={`routes-tab-${item.id}`} aria-controls="routes-panel" sx={styles.tab} />
        ))}
      </Tabs>
      <Box id="routes-panel" role="tabpanel" aria-labelledby={`routes-tab-${scope}`}>
        <CardCarousel key={scope} label={`${scope} flight routes`} itemWidth={{ xs: "72%", sm: "40%", md: "23.5%" }}>
          {shown.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              fare={fares?.find((fare) => fare.from === route.from && fare.to === route.to) ?? null}
              pending={pending}
            />
          ))}
        </CardCarousel>
      </Box>
    </Box>
  );
}
