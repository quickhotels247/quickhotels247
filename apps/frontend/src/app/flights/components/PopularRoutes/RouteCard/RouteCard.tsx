"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import type { PopularRouteFare } from "@quickhotels/types/flights";
import { airportByCode } from "@/components/search/FlightSearchBar/airports";
import { routes as siteRoutes } from "@/config/navigation";
import { formatShortDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import type { PopularRoute } from "../../../data/types";
import { styles } from "./RouteCard.styles";

interface RouteCardProps {
  route: PopularRoute;
  // The cheapest live fare, or null when there isn't one (yet).
  fare: PopularRouteFare | null;
  // True while a fare may still arrive, to show a placeholder.
  pending: boolean;
}

// Destination photo, "Delhi → Goa", the fare's dates, and the lowest
// round-trip fare per adult. Opens a search for those dates.
export default function RouteCard({ route, fare, pending }: RouteCardProps) {
  const from = airportByCode(route.from);
  const to = airportByCode(route.to);
  const href = `${siteRoutes.flightSearch}?${new URLSearchParams({
    tripType: "roundTrip",
    from: route.from,
    to: route.to,
    ...(fare ? { depart: fare.depart, return: fare.return } : {}),
  })}`;
  return (
    <Card sx={styles.card}>
      <CardActionArea component={Link} href={href} sx={styles.action}>
        <Box sx={styles.media}>
          <Image src={route.imageUrl} alt={to?.city ?? route.to} fill sizes="(max-width: 600px) 72vw, 290px" style={{ objectFit: "cover" }} />
        </Box>
        <Box sx={styles.body}>
          <Typography component="h3" sx={styles.route}>
            {from?.city ?? route.from}
            <ArrowForwardRounded sx={styles.arrow} aria-label="to" />
            {to?.city ?? route.to}
          </Typography>
          <Typography sx={styles.meta}>
            {fare ? `${formatShortDate(fare.depart)} – ${formatShortDate(fare.return)}` : `${route.from} – ${route.to}`} · Round-trip
          </Typography>
          {fare ? (
            <>
              <Typography sx={styles.price}>
                from <Box component="span" sx={styles.amount}>{formatPrice(fare.price)}</Box>
              </Typography>
              <Typography sx={styles.note}>per adult, live fare</Typography>
            </>
          ) : pending ? (
            <Box sx={styles.price}>
              <Skeleton width="55%" height={28} />
              <Skeleton width="40%" height={16} />
            </Box>
          ) : (
            <Typography sx={styles.price}>Search fares</Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
