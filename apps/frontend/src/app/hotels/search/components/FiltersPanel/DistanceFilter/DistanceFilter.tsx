"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { styles } from "./DistanceFilter.styles";

interface DistanceFilterProps {
  // Up to what most hotels are within; the far end means "any distance".
  maxKm: number;
  value?: number;
  // Called when the visitor lets go; undefined means no limit.
  onChange: (maxDistanceKm: number | undefined) => void;
}

const km = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)} km`;

// "Within 5 km": a one-handle slider from the search's centre point.
export default function DistanceFilter({ maxKm, value, onChange }: DistanceFilterProps) {
  // The handle's position while dragging; null shows the chosen distance.
  const [dragging, setDragging] = useState<number | null>(null);
  const step = maxKm <= 20 ? 0.5 : 1;
  const min = step;
  const shown = dragging ?? Math.min(maxKm, value ?? maxKm);
  const any = shown >= maxKm;

  return (
    <Box>
      <Typography sx={styles.range} aria-live="polite">
        {any ? "Any distance" : `Within ${km(shown)}`}
      </Typography>
      <Slider
        value={shown}
        min={min}
        max={maxKm}
        step={step}
        onChange={(_, next) => setDragging(next as number)}
        onChangeCommitted={(_, next) => {
          setDragging(null);
          onChange((next as number) >= maxKm ? undefined : (next as number));
        }}
        aria-label="Greatest distance from the centre"
        getAriaValueText={(next) => (next >= maxKm ? "Any distance" : `Within ${km(next)}`)}
        sx={styles.slider}
      />
      <Box sx={styles.scale} aria-hidden="true">
        <span>{km(min)}</span>
        <span>{km(maxKm)}+</span>
      </Box>
    </Box>
  );
}
