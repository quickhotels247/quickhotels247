import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import TuneRounded from "@mui/icons-material/TuneRounded";
import type { HotelSort, SearchCentre } from "@quickhotels/types/hotels";
import { formatCount } from "@/lib/format";
import { SORT_OPTIONS } from "../../utils/searchView";
import { styles } from "./ResultsHeader.styles";

interface ResultsHeaderProps {
  destination: string;
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

// "Goa: 140 properties found", then sort order (and a Filters button below desktop width).
export default function ResultsHeader({ destination, found, sort, centre, activeFilters, onSort, onOpenFilters }: ResultsHeaderProps) {
  const options = SORT_OPTIONS.flatMap((option) =>
    option.value !== "distance"
      ? [option]
      : centre?.kind === "landmark"
        ? [{ ...option, label: `Distance from ${centre.name}` }]
        : centre || sort === "distance"
          ? [option]
          : [],
  );
  return (
    <Box sx={styles.root}>
      <Typography component="h1" sx={styles.title}>
        {found ? (
          `${destination}: ${formatCount(found.total)}${found.complete ? "" : "+"} ${found.total === 1 ? "property" : "properties"} found`
        ) : (
          <Skeleton width={260} />
        )}
      </Typography>
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
