"use client";

import { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import CloseRounded from "@mui/icons-material/CloseRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { styles } from "./NameFilter.styles";

interface NameFilterProps {
  value: string;
  onChange: (name: string) => void;
}

// Wait for a pause in typing before reloading the results.
const DEBOUNCE_MS = 400;

// "Property name" box: narrows the results to names containing the text.
export default function NameFilter({ value, onChange }: NameFilterProps) {
  const [text, setText] = useState(value);

  // Follow outside changes (e.g. "Clear all").
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const timer = setTimeout(() => onChange(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  return (
    <TextField
      size="small"
      fullWidth
      placeholder="e.g. Taj, Marriott"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => event.key === "Enter" && onChange(text.trim())}
      sx={styles.root}
      slotProps={{
        htmlInput: { "aria-label": "Property name", maxLength: 60 },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: text ? (
            <InputAdornment position="end">
              <IconButton size="small" aria-label="Clear property name" onClick={() => (setText(""), onChange(""))}>
                <CloseRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}
