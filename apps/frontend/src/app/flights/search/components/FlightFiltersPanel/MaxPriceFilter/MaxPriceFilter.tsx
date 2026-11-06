"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { formatPrice } from "@/lib/format";
import { styles } from "./MaxPriceFilter.styles";

interface MaxPriceFilterProps {
  bounds: { min: number; max: number };
  currency: string;
  value?: number;
  // Called when the visitor lets go; undefined means no limit.
  onChange: (maxPrice: number | undefined) => void;
}

// "Up to ₹8,000": a one-handle slider over the fares found.
export default function MaxPriceFilter({ bounds, currency, value, onChange }: MaxPriceFilterProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const step = Math.max(100, Math.round((bounds.max - bounds.min) / 50 / 100) * 100);
  const shown = dragging ?? Math.min(bounds.max, value ?? bounds.max);
  const money = (amount: number) => formatPrice({ amount, currency });
  if (bounds.max <= bounds.min) return null;
  return (
    <Box>
      <Typography sx={styles.range} aria-live="polite">
        {shown >= bounds.max ? "Any price" : `Up to ${money(shown)}`}
      </Typography>
      <Slider
        value={shown}
        min={bounds.min}
        max={bounds.max}
        step={step}
        onChange={(_, next) => setDragging(next as number)}
        onChangeCommitted={(_, next) => {
          setDragging(null);
          onChange((next as number) >= bounds.max ? undefined : (next as number));
        }}
        aria-label="Highest price"
        getAriaValueText={money}
        sx={styles.slider}
      />
      <Box sx={styles.scale} aria-hidden="true">
        <span>{money(bounds.min)}</span>
        <span>{money(bounds.max)}</span>
      </Box>
    </Box>
  );
}
