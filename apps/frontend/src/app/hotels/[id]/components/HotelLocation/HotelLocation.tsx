import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MapOutlined from "@mui/icons-material/MapOutlined";
import type { HotelDetails } from "@quickhotels/types/hotels";
import { styles } from "./HotelLocation.styles";

interface HotelLocationProps {
  hotel: HotelDetails;
}

// About ±600 m around the hotel.
const SPAN = 0.006;

// An OpenStreetMap view around the hotel (no API key needed), the address,
// and a link for directions.
export default function HotelLocation({ hotel }: HotelLocationProps) {
  const { latitude: lat, longitude: lng } = hotel;
  const known = lat !== null && lng !== null;
  const directions = known
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([hotel.name, hotel.address].filter(Boolean).join(", "))}`;
  return (
    <Box sx={styles.root}>
      {known && (
        <Box
          component="iframe"
          title={`Map showing ${hotel.name}`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - SPAN},${lat - SPAN},${lng + SPAN},${lat + SPAN}&layer=mapnik&marker=${lat},${lng}`}
          loading="lazy"
          sx={styles.map}
        />
      )}
      <Box sx={styles.side}>
        {hotel.address && <Typography sx={styles.address}>{hotel.address}</Typography>}
        <Button variant="outlined" startIcon={<MapOutlined />} href={directions} target="_blank" rel="noopener noreferrer">
          Get directions
        </Button>
      </Box>
    </Box>
  );
}
