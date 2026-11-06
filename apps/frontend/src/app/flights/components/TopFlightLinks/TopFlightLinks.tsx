"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import SectionHeader from "@/components/common/SectionHeader";
import type { FlightLinkGroup } from "../../data/types";
import FlightLinkItem from "./FlightLinkItem";
import { styles } from "./TopFlightLinks.styles";

interface TopFlightLinksProps {
  groups: FlightLinkGroup[];
}

// "Top flights from India": pill tabs of route, city, country and airport links.
export default function TopFlightLinks({ groups }: TopFlightLinksProps) {
  const [active, setActive] = useState(groups[0]?.id ?? "");
  const group = groups.find((item) => item.id === active);
  if (!group) return null;

  return (
    <Box component="section" id="top-flights" aria-labelledby="top-flights-title" sx={styles.root}>
      <SectionHeader id="top-flights-title" title="Top flights from India" subtitle="Explore destinations you can reach from India and start making new plans" />
      <Box role="tablist" aria-label="Kind of link" sx={styles.tabs}>
        {groups.map((item) => {
          const selected = item.id === active;
          return (
            <ButtonBase
              key={item.id}
              role="tab"
              id={`flight-links-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="flight-links-panel"
              onClick={() => setActive(item.id)}
              sx={styles.tab(selected)}
            >
              {item.label}
            </ButtonBase>
          );
        })}
      </Box>
      <Box component="ul" id="flight-links-panel" role="tabpanel" aria-labelledby={`flight-links-tab-${active}`} sx={styles.list}>
        {group.links.map((link) => (
          <li key={`${link.from ?? ""}-${link.to}-${link.label}`}>
            <FlightLinkItem link={link} />
          </li>
        ))}
      </Box>
    </Box>
  );
}
