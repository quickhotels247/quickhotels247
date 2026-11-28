"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { allowedTypos, fuzzyDistance } from "@/lib/fuzzy";
import { styles } from "./NameFilter.styles";

interface NameFilterProps {
  value: string;
  onChange: (name: string) => void;
  // Suggestions from the results: areas (with how many hotels) and hotel names.
  areas: { name: string; count: number }[];
  hotelNames: string[];
}

interface Suggestion {
  kind: "Areas" | "Properties";
  label: string;
  count?: number;
}

// Wait for a pause in typing before reloading the results.
const DEBOUNCE_MS = 400;
const MAX_SHOWN = 4;
const MIN_TYPED = 2;

// How well a suggestion fits the text (lower is better), or null when it
// doesn't: starts with it, then contains it, then a close spelling.
function fit(typed: string, label: string): number | null {
  const name = label.toLowerCase();
  if (name.startsWith(typed)) return 0;
  if (name.includes(typed)) return 1;
  const typos = fuzzyDistance(typed, name);
  return typos <= allowedTypos(typed.length) ? 1 + typos : null;
}

// Areas and hotels matching the text in any case, allowing a typo or two in
// longer words, best fits first (and busier areas before quieter ones).
function suggest(text: string, areas: Suggestion[], hotels: Suggestion[]): Suggestion[] {
  const typed = text.trim().toLowerCase();
  if (typed.length < MIN_TYPED) return [];
  const pick = (list: Suggestion[]) =>
    list
      .flatMap((item) => {
        const score = item.label.toLowerCase() === typed ? null : fit(typed, item.label);
        return score === null ? [] : [{ item, score }];
      })
      .sort((a, b) => a.score - b.score || (b.item.count ?? 0) - (a.item.count ?? 0))
      .slice(0, MAX_SHOWN)
      .map(({ item }) => item);
  return [...pick(areas), ...pick(hotels)];
}

// "Property name or area" box: narrows the results to hotels whose name or
// address has every word typed (matched by the server), suggesting areas and
// hotels from the results while typing.
export default function NameFilter({ value, onChange, areas, hotelNames }: NameFilterProps) {
  const [text, setText] = useState(value);

  // Follow outside changes (e.g. "Clear all").
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const timer = setTimeout(() => onChange(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  const areaOptions = useMemo<Suggestion[]>(() => areas.map((area) => ({ kind: "Areas", label: area.name, count: area.count })), [areas]);
  const hotelOptions = useMemo<Suggestion[]>(() => hotelNames.map((name) => ({ kind: "Properties", label: name })), [hotelNames]);
  const options = useMemo(() => suggest(text, areaOptions, hotelOptions), [text, areaOptions, hotelOptions]);

  return (
    <Autocomplete
      freeSolo
      size="small"
      fullWidth
      options={options}
      // Options are already narrowed to the text above.
      filterOptions={(list) => list}
      groupBy={(option) => (typeof option === "string" ? "" : option.kind)}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
      inputValue={text}
      onInputChange={(_event, next, reason) => reason !== "reset" && setText(next)}
      onChange={(_event, picked) => {
        const chosen = typeof picked === "string" ? picked : (picked?.label ?? "");
        setText(chosen);
        onChange(chosen.trim());
      }}
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={key} {...props} sx={styles.option}>
          {option.kind === "Areas" ? <PlaceOutlined fontSize="small" /> : <ApartmentRounded fontSize="small" />}
          <Typography component="span" sx={styles.optionLabel}>
            {option.label}
          </Typography>
          {option.count !== undefined && (
            <Typography component="span" sx={styles.optionCount}>
              {option.count}
            </Typography>
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="e.g. Taj, Banjara Hills"
          onKeyDown={(event) => event.key === "Enter" && !options.length && onChange(text.trim())}
          sx={styles.root}
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, "aria-label": "Property name or area", maxLength: 60 },
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
