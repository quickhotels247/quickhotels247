"use client";

import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { HotelAmenity, HotelFacets, HotelFilters, SearchCentre } from "@quickhotels/types/hotels";
import StarRating from "@/components/hotel/StarRating";
import { AMENITY_LABELS, propertyTypeLabel } from "@/config/hotelAmenities";
import { activeFilterCount } from "../../utils/searchView";
import DistanceFilter from "./DistanceFilter";
import FilterGroup from "@/components/filters/FilterGroup";
import FilterOption from "@/components/filters/FilterOption";
import NameFilter from "./NameFilter";
import PriceFilter from "./PriceFilter";
import { styles } from "./FiltersPanel.styles";

interface FiltersPanelProps {
  // Counts over the priced hotels; null before the first results arrive.
  facets: HotelFacets | null;
  filters: HotelFilters;
  // Where distances are measured from; null hides the distance filter.
  centre: SearchCentre | null;
  currency: string;
  onChange: (filters: HotelFilters) => void;
}

const STAR_LEVELS = [5, 4, 3, 2, 1, 0];
// Amenities shown before "Show all".
const AMENITIES_SHOWN = 6;

// Toggles one value in an optional list, dropping the list when it empties.
function toggle<T>(list: T[] | undefined, value: T, on: boolean): T[] | undefined {
  const rest = (list ?? []).filter((item) => item !== value);
  const next = on ? [...rest, value] : rest;
  return next.length ? next : undefined;
}

// "Filter by": name, budget, distance, popular choices, star rating,
// property type and amenities. Each change reloads the results from the same search (no new
// supplier search). Options no hotel has are hidden unless already chosen.
export default function FiltersPanel({ facets, filters, centre, currency, onChange }: FiltersPanelProps) {
  const [allAmenities, setAllAmenities] = useState(false);
  const set = (changes: HotelFilters) => onChange({ ...filters, ...changes });
  const setName = useCallback((name: string) => onChange({ ...filters, name: name || undefined }), [filters, onChange]);

  const levels = STAR_LEVELS.filter((star) => (facets?.stars[star] ?? 0) > 0 || filters.stars?.includes(star));
  const types = Object.entries(facets?.propertyTypes ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type)
    .concat((filters.propertyTypes ?? []).filter((type) => !facets?.propertyTypes[type]));
  const amenities = AMENITY_LABELS.filter(({ id }) => (facets?.amenities[id] ?? 0) > 0 || filters.amenities?.includes(id));
  const shownAmenities = allAmenities ? amenities : amenities.slice(0, AMENITIES_SHOWN);
  const active = activeFilterCount(filters);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography component="h2" sx={styles.title}>
          Filter by
        </Typography>
        {active > 0 && (
          <Button size="small" onClick={() => onChange({})} sx={styles.clear}>
            Clear all
          </Button>
        )}
      </Box>

      <FilterGroup title="Property name">
        <NameFilter value={filters.name ?? ""} onChange={setName} />
      </FilterGroup>

      {facets?.pricePerNight && (
        <FilterGroup title="Your budget (per night)">
          <PriceFilter
            bounds={facets.pricePerNight}
            currency={currency}
            min={filters.minPrice}
            max={filters.maxPrice}
            onChange={(range) => set(range)}
          />
        </FilterGroup>
      )}

      {centre && facets?.distanceKm && (
        <FilterGroup title={`Distance from ${centre.name}`}>
          <DistanceFilter maxKm={facets.distanceKm.max} value={filters.maxDistanceKm} onChange={(maxDistanceKm) => set({ maxDistanceKm })} />
        </FilterGroup>
      )}

      <FilterGroup title="Popular filters">
        <FilterOption
          label="Free cancellation"
          count={facets?.freeCancellation}
          checked={Boolean(filters.freeCancellation)}
          onChange={(on) => set({ freeCancellation: on || undefined })}
        />
        <FilterOption
          label="Breakfast included"
          count={facets?.mealIncluded}
          checked={Boolean(filters.mealIncluded)}
          onChange={(on) => set({ mealIncluded: on || undefined })}
        />
        {(facets?.amenities.wifi ?? 0) > 0 && (
          <FilterOption
            label="Free WiFi"
            count={facets?.amenities.wifi}
            checked={Boolean(filters.amenities?.includes("wifi"))}
            onChange={(on) => set({ amenities: toggle(filters.amenities, "wifi", on) })}
          />
        )}
      </FilterGroup>

      {levels.length > 0 && (
        <FilterGroup title="Star rating">
          {levels.map((star) => (
            <FilterOption
              key={star}
              label={star === 0 ? "Not rated" : <StarRating stars={star} />}
              count={facets?.stars[star] ?? 0}
              checked={Boolean(filters.stars?.includes(star))}
              onChange={(on) => set({ stars: toggle(filters.stars, star, on) })}
            />
          ))}
        </FilterGroup>
      )}

      {types.length > 1 && (
        <FilterGroup title="Property type">
          {types.map((type) => (
            <FilterOption
              key={type}
              label={propertyTypeLabel(type)}
              count={facets?.propertyTypes[type] ?? 0}
              checked={Boolean(filters.propertyTypes?.includes(type))}
              onChange={(on) => set({ propertyTypes: toggle(filters.propertyTypes, type, on) })}
            />
          ))}
        </FilterGroup>
      )}

      {amenities.length > 0 && (
        <FilterGroup title="Facilities">
          {shownAmenities.map(({ id, label }) => (
            <FilterOption
              key={id}
              label={label}
              count={facets?.amenities[id] ?? 0}
              checked={Boolean(filters.amenities?.includes(id))}
              onChange={(on) => set({ amenities: toggle<HotelAmenity>(filters.amenities, id, on) })}
            />
          ))}
          {amenities.length > AMENITIES_SHOWN && (
            <Button size="small" onClick={() => setAllAmenities((open) => !open)} sx={styles.more}>
              {allAmenities ? "Show fewer" : `Show all ${amenities.length}`}
            </Button>
          )}
        </FilterGroup>
      )}
    </Box>
  );
}
