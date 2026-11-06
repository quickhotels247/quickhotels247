"use client";

import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import RequireAuth from "@/components/auth/RequireAuth";
import { routes } from "@/config/navigation";
import { useWishlist } from "@/lib/wishlist/useWishlist";
import AccountTabs from "../../components/AccountTabs";
import SavedHotelCard from "../components/SavedHotelCard";
import { styles } from "./SavedHotelsPage.styles";

export default function SavedHotelsPage() {
  return (
    <RequireAuth>
      <SavedHotels />
    </RequireAuth>
  );
}

function SavedHotels() {
  const { hotels, ready, error, clearError } = useWishlist();
  return (
    <Container maxWidth="lg" sx={styles.root}>
      <Typography component="h1" sx={styles.title}>
        Saved hotels
      </Typography>
      <AccountTabs />
      <Typography sx={styles.subtitle}>Hotels you saved with the heart. Open one to check prices for your dates.</Typography>
      {error && (
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      )}
      {!ready && (
        <Box sx={styles.grid}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={280} sx={styles.skeleton} />
          ))}
        </Box>
      )}
      {ready && hotels.length === 0 && (
        <Box sx={styles.empty}>
          <FavoriteBorderRounded sx={styles.emptyIcon} />
          <Typography sx={styles.emptyTitle}>No saved hotels yet</Typography>
          <Typography sx={styles.subtitle}>Tap the heart on any hotel to keep it here.</Typography>
          <Button component={Link} href={routes.home} variant="contained" sx={styles.emptyButton}>
            Find hotels
          </Button>
        </Box>
      )}
      {ready && hotels.length > 0 && (
        <Box sx={styles.grid}>
          {hotels.map((hotel) => (
            <SavedHotelCard key={hotel.hotelId} hotel={hotel} />
          ))}
        </Box>
      )}
    </Container>
  );
}
