"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { DepartWindow, FlightFacets, FlightFilters } from "@quickhotels/types/flights";
import FilterGroup from "@/components/filters/FilterGroup";
import FilterOption from "@/components/filters/FilterOption";
import { formatPrice } from "@/lib/format";
import { activeFlightFilters } from "../../utils/flightView";
import MaxPriceFilter from "./MaxPriceFilter";
import { styles } from "./FlightFiltersPanel.styles";

interface FlightFiltersPanelProps {
  facets: FlightFacets | null;
  filters: FlightFilters;
  currency: string;
  onChange: (filters: FlightFilters) => void;
}

const STOP_LABELS = ["Non-stop", "1 stop", "2+ stops"];
const WINDOW_LABELS: Record<DepartWindow, string> = {
  early: "Early morning (00:00–06:00)",
  morning: "Morning (06:00–12:00)",
  afternoon: "Afternoon (12:00–18:00)",
  evening: "Evening (18:00–24:00)",
};
const AIRLINES_SHOWN = 6;

// Toggles one value in an optional list, dropping the list when it empties.
function toggle<T>(list: T[] | undefined, value: T, on: boolean): T[] | undefined {
  const rest = (list ?? []).filter((item) => item !== value);
  const next = on ? [...rest, value] : rest;
  return next.length ? next : undefined;
}

// "Filter by": stops, departure time, airlines, price and refundability,
// each with its count (and cheapest fare for stops and airlines).
export default function FlightFiltersPanel({ facets, filters, currency, onChange }: FlightFiltersPanelProps) {
  const [allAirlines, setAllAirlines] = useState(false);
  const set = (changes: FlightFilters) => onChange({ ...filters, ...changes });
  const money = (amount: number) => formatPrice({ amount, currency });
  const airlines = facets?.airlines ?? [];
  const shownAirlines = allAirlines ? airlines : airlines.slice(0, AIRLINES_SHOWN);
  const active = activeFlightFilters(filters);

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

      {facets && facets.stops.length > 0 && (
        <FilterGroup title="Stops">
          {facets.stops.map(({ stops, count, minPrice }) => (
            <FilterOption
              key={stops}
              label={
                <Box component="span" sx={styles.withPrice}>
                  {STOP_LABELS[stops]}
                  <Box component="span" sx={styles.minPrice}>
                    from {money(minPrice)}
                  </Box>
                </Box>
              }
              count={count}
              checked={Boolean(filters.stops?.includes(stops))}
              onChange={(on) => set({ stops: toggle(filters.stops, stops, on) })}
            />
          ))}
        </FilterGroup>
      )}

      {facets && facets.departWindows.length > 0 && (
        <FilterGroup title="Departure time">
          {facets.departWindows.map(({ window, count }) => (
            <FilterOption
              key={window}
              label={WINDOW_LABELS[window]}
              count={count}
              checked={Boolean(filters.departWindows?.includes(window))}
              onChange={(on) => set({ departWindows: toggle(filters.departWindows, window, on) })}
            />
          ))}
        </FilterGroup>
      )}

      {airlines.length > 0 && (
        <FilterGroup title="Airlines">
          {shownAirlines.map(({ code, name, count, minPrice }) => (
            <FilterOption
              key={code}
              label={
                <Box component="span" sx={styles.withPrice}>
                  {name}
                  <Box component="span" sx={styles.minPrice}>
                    from {money(minPrice)}
                  </Box>
                </Box>
              }
              count={count}
              checked={Boolean(filters.airlines?.includes(code))}
              onChange={(on) => set({ airlines: toggle(filters.airlines, code, on) })}
            />
          ))}
          {airlines.length > AIRLINES_SHOWN && (
            <Button size="small" onClick={() => setAllAirlines((open) => !open)} sx={styles.more}>
              {allAirlines ? "Show fewer" : `Show all ${airlines.length}`}
            </Button>
          )}
        </FilterGroup>
      )}

      {facets?.price && (
        <FilterGroup title="Price">
          <MaxPriceFilter bounds={facets.price} currency={currency} value={filters.maxPrice} onChange={(maxPrice) => set({ maxPrice })} />
        </FilterGroup>
      )}

      {facets && facets.refundable > 0 && (
        <FilterGroup title="Fare">
          <FilterOption
            label="Refundable fares only"
            count={facets.refundable}
            checked={Boolean(filters.refundableOnly)}
            onChange={(on) => set({ refundableOnly: on || undefined })}
          />
        </FilterGroup>
      )}
    </Box>
  );
}
