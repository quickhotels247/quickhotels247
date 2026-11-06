"use client";

import type { ReactNode } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import type { Airport } from "@quickhotels/types/flights";
import SearchFieldShell from "@/components/search/SearchFieldShell";
import { airportByCode, airports } from "../airports";
import { styles } from "./AirportField.styles";

interface AirportFieldProps {
  label: string;
  icon: ReactNode;
  value: string; // IATA code, or "" when empty
  onChange: (code: string) => void;
  invalid: boolean;
}

// Type a city, airport or code and pick from the list.
export default function AirportField({ label, icon, value, onChange, invalid }: AirportFieldProps) {
  return (
    <SearchFieldShell icon={icon} label={label} invalid={invalid}>
      <Autocomplete<Airport>
        options={airports}
        value={airportByCode(value)}
        onChange={(_, airport) => onChange(airport?.code ?? "")}
        getOptionLabel={(airport) => `${airport.city} (${airport.code})`}
        isOptionEqualToValue={(option, selected) => option.code === selected.code}
        filterOptions={(options, { inputValue }) => {
          const query = inputValue.trim().toLowerCase();
          if (!query) return options;
          return options.filter((airport) =>
            [airport.code, airport.city, airport.name, airport.country].some((text) => text.toLowerCase().includes(query)),
          );
        }}
        noOptionsText="No matching airport"
        autoHighlight
        fullWidth
        sx={styles.autocomplete}
        slotProps={{ paper: { sx: styles.paper } }}
        renderOption={({ key, ...optionProps }, airport) => (
          <Box component="li" key={key} {...optionProps} sx={styles.option}>
            <Box sx={styles.code}>{airport.code}</Box>
            <Box sx={styles.optionText}>
              <Typography sx={styles.city}>{airport.city}</Typography>
              <Typography sx={styles.airportName}>
                {airport.name}, {airport.country}
              </Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <InputBase
            ref={params.slotProps.input.ref}
            className={params.slotProps.input.className}
            endAdornment={params.slotProps.input.endAdornment}
            placeholder="City or airport"
            fullWidth
            sx={styles.input}
            slotProps={{ input: { ...params.slotProps.htmlInput, "aria-label": label, "aria-invalid": invalid } }}
          />
        )}
      />
    </SearchFieldShell>
  );
}
