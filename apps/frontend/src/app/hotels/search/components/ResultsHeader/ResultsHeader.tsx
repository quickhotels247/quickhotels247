import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import TuneRounded from "@mui/icons-material/TuneRounded";
import type { HotelSort, SearchCentre } from "@quickhotels/types/hotels";
import { allowedTypos, fuzzyDistance } from "@/lib/fuzzy";
import { SORT_OPTIONS } from "../../utils/searchView";
import { styles } from "./ResultsHeader.styles";

interface ResultsHeaderProps {
  destination: string;
  // The "Property name or area" text, when set.
  nameFilter?: string;
  // The areas in the results, to tell an area ("Hyderabad: Shamshabad") from
  // a hotel name (no heading).
  areas?: { name: string; count: number }[];
  // Null until the first page arrives.
  found: { total: number; complete: boolean } | null;
  sort: HotelSort;
  // Names the distance sort ("Distance from Charminar"); without one it's hidden.
  centre: SearchCentre | null;
  activeFilters: number;
  onSort: (sort: HotelSort) => void;
  // Opens the filter drawer on phones and tablets.
  onOpenFilters: () => void;
}

// The area the text names, in its proper spelling: the same words in any
// case, or a typo or two away ("shamsabad" → "Shamshabad").
function areaNamed(text: string, areas: { name: string }[]): string | null {
  const typed = text.trim().toLowerCase();
  if (!typed) return null;
  const typos = allowedTypos(typed.length);
  const exact = areas.find((area) => area.name.toLowerCase() === typed);
  if (exact) return exact.name;
  const close = areas.find(
    (area) => Math.abs(area.name.length - typed.length) <= typos && fuzzyDistance(typed, area.name.toLowerCase()) <= typos,
  );
  return close?.name ?? null;
}

// "Hyderabad" (or "Hyderabad: Shamshabad" when narrowed to an area; nothing
// when narrowed to a hotel name), then sort order (and a Filters button below
// desktop width). No hotel count: the city's hotels are priced a batch at a
// time, so any count would be only what's been priced so far.
export default function ResultsHeader({ destination, nameFilter, areas = [], found, sort, centre, activeFilters, onSort, onOpenFilters }: ResultsHeaderProps) {
  const options = SORT_OPTIONS.flatMap((option) =>
    option.value !== "distance"
      ? [option]
      : centre?.kind === "landmark"
        ? [{ ...option, label: `Distance from ${centre.name}` }]
        : centre || sort === "distance"
          ? [option]
          : [],
  );
  const city = destination.split(",")[0]!.trim();
  const area = nameFilter ? areaNamed(nameFilter, areas) : null;
  const typed = nameFilter?.trim().toLowerCase();
  const title = !typed || typed === city.toLowerCase() ? city : area ? `${city}: ${area}` : null;
  return (
    <Box sx={styles.root}>
      {title !== null && (
        <Typography component="h1" sx={styles.title}>
          {found ? title : <Skeleton width={200} />}
        </Typography>
      )}
      <Box sx={styles.controls}>
        <Badge badgeContent={activeFilters} color="primary" sx={styles.filtersButton}>
          <Button variant="outlined" startIcon={<TuneRounded />} onClick={onOpenFilters} fullWidth>
            Filters
          </Button>
        </Badge>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sort}
          onChange={(event) => onSort(event.target.value as HotelSort)}
          sx={styles.sort}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
}
