"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckRounded from "@mui/icons-material/CheckRounded";
import { styles } from "./HotelFacilities.styles";

interface HotelFacilitiesProps {
  facilities: string[];
}

const SHOWN = 24;

// Every facility the hotel lists, in columns.
export default function HotelFacilities({ facilities }: HotelFacilitiesProps) {
  const [all, setAll] = useState(false);
  const shown = all ? facilities : facilities.slice(0, SHOWN);
  return (
    <Box>
      <Box component="ul" sx={styles.list}>
        {shown.map((facility) => (
          <Box component="li" key={facility} sx={styles.item}>
            <CheckRounded sx={styles.icon} aria-hidden="true" />
            {facility}
          </Box>
        ))}
      </Box>
      {facilities.length > SHOWN && (
        <Button onClick={() => setAll((open) => !open)} sx={styles.more}>
          {all ? "Show fewer" : `Show all ${facilities.length} facilities`}
        </Button>
      )}
    </Box>
  );
}
