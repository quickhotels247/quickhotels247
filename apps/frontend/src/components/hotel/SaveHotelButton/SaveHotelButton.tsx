"use client";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRounded from "@mui/icons-material/FavoriteRounded";
import type { SaveHotelRequest } from "@quickhotels/types/wishlist";
import { useWishlist } from "@/lib/wishlist/useWishlist";
import { styles } from "./SaveHotelButton.styles";

interface SaveHotelButtonProps {
  hotelId: string;
  hotel: SaveHotelRequest;
  // "overlay": white circle on a photo; "plain": next to text.
  variant?: "overlay" | "plain";
}

// The heart: saves the hotel to the customer's wishlist (/account/saved).
export default function SaveHotelButton({ hotelId, hotel, variant = "overlay" }: SaveHotelButtonProps) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(hotelId);
  const label = saved ? `Remove ${hotel.name} from saved` : `Save ${hotel.name}`;
  return (
    <Tooltip title={saved ? "Saved" : "Save"}>
      <IconButton
        aria-label={label}
        aria-pressed={saved}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void toggle(hotelId, hotel);
        }}
        sx={[styles.button, variant === "overlay" && styles.overlay]}
      >
        {saved ? <FavoriteRounded sx={styles.saved} /> : <FavoriteBorderRounded />}
      </IconButton>
    </Tooltip>
  );
}
