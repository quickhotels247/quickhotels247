"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { cityPagePath } from "@/app/hotels/in/data/cities";
import { routes } from "@/config/navigation";
import type { LinkGroup } from "../../data/types";
import SectionHeader from "@/components/common/SectionHeader";
import { styles } from "./PopularLinks.styles";

interface PopularLinksProps {
  groups: LinkGroup[];
}

// "Popular with travellers from India": tabs of plain hotel-search links.
export default function PopularLinks({ groups }: PopularLinksProps) {
  const [active, setActive] = useState(groups[0]?.id ?? "");
  const group = groups.find((item) => item.id === active);
  if (!group) return null;

  return (
    <Box component="section" aria-labelledby="popular-links">
      <SectionHeader id="popular-links" title="Popular with travellers from India" />
      <Tabs value={active} onChange={(_, value: string) => setActive(value)} variant="scrollable" scrollButtons={false} aria-label="Link groups" sx={styles.tabs}>
        {groups.map((item) => (
          <Tab key={item.id} value={item.id} label={item.label} id={`links-tab-${item.id}`} aria-controls="links-panel" sx={styles.tab} />
        ))}
      </Tabs>
      <Box component="ul" id="links-panel" role="tabpanel" aria-labelledby={`links-tab-${active}`} sx={styles.list}>
        {group.links.map((link) => (
          <li key={link.destination}>
            <MuiLink component={Link} href={cityPagePath(link.destination) ?? `${routes.hotels}?${new URLSearchParams({ destination: link.destination })}`} sx={styles.link}>
              {link.label}
            </MuiLink>
          </li>
        ))}
      </Box>
    </Box>
  );
}
