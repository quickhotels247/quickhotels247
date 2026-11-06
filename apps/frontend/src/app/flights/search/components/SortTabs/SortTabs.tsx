import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { FlightHighlights, FlightSort } from "@quickhotels/types/flights";
import { formatPrice } from "@/lib/format";
import { duration } from "@/lib/flightFormat";
import { styles } from "./SortTabs.styles";

interface SortTabsProps {
  sort: FlightSort;
  highlights: FlightHighlights | null;
  currency: string;
  onSort: (sort: FlightSort) => void;
}

// Cheapest · Fastest · Earliest, each with what it gets you.
export default function SortTabs({ sort, highlights, currency, onSort }: SortTabsProps) {
  const tabs: { value: FlightSort; label: string; detail: string | null }[] = [
    {
      value: "price",
      label: "Cheapest",
      detail: highlights?.cheapest ? `${formatPrice({ amount: highlights.cheapest.price, currency })} · ${duration(highlights.cheapest.durationMins)}` : null,
    },
    {
      value: "duration",
      label: "Fastest",
      detail: highlights?.fastest ? `${formatPrice({ amount: highlights.fastest.price, currency })} · ${duration(highlights.fastest.durationMins)}` : null,
    },
    { value: "departure", label: "Earliest", detail: "Departure time" },
  ];
  return (
    <Box role="tablist" aria-label="Sort flights" sx={styles.root}>
      {tabs.map((tab) => (
        <ButtonBase key={tab.value} role="tab" aria-selected={sort === tab.value} onClick={() => onSort(tab.value)} sx={[styles.tab, sort === tab.value && styles.active]}>
          <Typography sx={styles.label}>{tab.label}</Typography>
          {tab.detail && <Typography sx={styles.detail}>{tab.detail}</Typography>}
        </ButtonBase>
      ))}
    </Box>
  );
}
