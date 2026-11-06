"use client";

import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import LocationCityRounded from "@mui/icons-material/LocationCityRounded";
import MapOutlined from "@mui/icons-material/MapOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import type { DestinationSuggestion } from "@quickhotels/types/hotels";
import SearchFieldShell from "@/components/search/SearchFieldShell";
import { destinationsApi } from "@/lib/api/destinations";
import { formatCount } from "@/lib/format";
import { styles } from "./DestinationField.styles";

interface DestinationFieldProps {
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  // A suggestion was chosen (not just typed), e.g. to search straight away.
  onPick?: (value: string) => void;
}

const MIN_LETTERS = 2;
// Wait for a pause in typing before asking the backend.
const DEBOUNCE_MS = 200;

const kindIcon = { city: <LocationCityRounded />, area: <PlaceOutlined />, region: <MapOutlined /> };

// Type a place and pick from TripJack's cities, areas and regions, or just
// search what was typed. Picking fills in "City, Country" so same-named
// places (Hyderabad, India / Pakistan) aren't mixed up.
export default function DestinationField({ value, onChange, invalid, onPick }: DestinationFieldProps) {
  const [options, setOptions] = useState<DestinationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const typed = value.trim();

  useEffect(() => {
    if (typed.length < MIN_LETTERS) {
      setOptions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      destinationsApi
        .suggest(typed, controller.signal)
        .then((found) => setOptions(found))
        // Suggestions are a convenience; typing still works without them.
        .catch(() => !controller.signal.aborted && setOptions([]))
        .finally(() => !controller.signal.aborted && setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [typed]);

  return (
    <SearchFieldShell icon={<PlaceOutlined />} invalid={invalid}>
      <Autocomplete<DestinationSuggestion, false, false, true>
        freeSolo
        options={options}
        inputValue={value}
        onInputChange={(_, text, reason) => reason !== "reset" && onChange(text)}
        onChange={(_, picked) => {
          const chosen = typeof picked === "string" ? picked : (picked?.query ?? "");
          onChange(chosen);
          if (picked && typeof picked !== "string") onPick?.(chosen);
        }}
        getOptionLabel={(option) => (typeof option === "string" ? option : option.query)}
        getOptionKey={(option) => (typeof option === "string" ? option : option.id)}
        // The backend already matched and ranked them.
        filterOptions={(list) => list}
        loading={loading}
        loadingText="Finding places…"
        noOptionsText={typed.length < MIN_LETTERS ? "Type at least 2 letters" : "No matching places. You can still search what you typed."}
        // Only once there's enough to look up.
        open={open && typed.length >= MIN_LETTERS}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        autoHighlight={false}
        fullWidth
        sx={styles.autocomplete}
        slotProps={{ paper: { sx: styles.paper } }}
        renderOption={({ key, ...optionProps }, option) => (
          <Box component="li" key={key} {...optionProps} sx={styles.option}>
            <Box sx={styles.icon}>{kindIcon[option.kind]}</Box>
            <Box sx={styles.optionText}>
              <Typography sx={styles.name}>{option.name}</Typography>
              <Typography sx={styles.detail}>{option.detail}</Typography>
            </Box>
            {option.hotelCount ? <Typography sx={styles.count}>{formatCount(option.hotelCount)} hotels</Typography> : null}
          </Box>
        )}
        renderInput={(params) => (
          <InputBase
            ref={params.slotProps.input.ref}
            className={params.slotProps.input.className}
            placeholder="Where do you want to go?"
            fullWidth
            sx={styles.input}
            slotProps={{
              input: {
                ...params.slotProps.htmlInput,
                "aria-label": "Destination",
                "aria-invalid": invalid,
                enterKeyHint: "search",
              },
            }}
          />
        )}
      />
    </SearchFieldShell>
  );
}
