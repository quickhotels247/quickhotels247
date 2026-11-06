"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { formatPrice } from "@/lib/format";
import { styles } from "./PriceFilter.styles";

interface PriceFilterProps {
  // Cheapest and dearest nightly price among the priced hotels.
  bounds: { min: number; max: number };
  currency: string;
  min?: number;
  max?: number;
  // Called when the visitor lets go; undefined ends mean "no limit".
  onChange: (range: { minPrice?: number; maxPrice?: number }) => void;
}

// "Your budget (per night)": a two-handle slider over the prices found, in
// round numbers from ₹1,000 (the backend rounds the ends).
export default function PriceFilter({ bounds, currency, min, max, onChange }: PriceFilterProps) {
  const chosen: [number, number] = [Math.max(bounds.min, min ?? bounds.min), Math.min(bounds.max, max ?? bounds.max)];
  // The handles' position while dragging; null shows the chosen range.
  const [dragging, setDragging] = useState<[number, number] | null>(null);
  const [low, high] = dragging ?? chosen;
  // Round ₹500 steps, finer only for a narrow range.
  const step = bounds.max - bounds.min > 5000 ? 500 : 100;
  const money = (amount: number) => formatPrice({ amount, currency });

  if (bounds.max <= bounds.min) return null;
  return (
    <Box>
      <Typography sx={styles.range} aria-live="polite">
        {money(low)} – {money(high)}
        {high >= bounds.max ? "+" : ""}
      </Typography>
      <Slider
        value={[low, high]}
        min={bounds.min}
        max={bounds.max}
        step={step}
        onChange={(_, value) => setDragging(value as [number, number])}
        onChangeCommitted={(_, value) => {
          const [nextLow, nextHigh] = value as [number, number];
          setDragging(null);
          onChange({
            minPrice: nextLow > bounds.min ? nextLow : undefined,
            maxPrice: nextHigh < bounds.max ? nextHigh : undefined,
          });
        }}
        getAriaLabel={(index) => (index === 0 ? "Lowest price per night" : "Highest price per night")}
        getAriaValueText={money}
        sx={styles.slider}
      />
    </Box>
  );
}
