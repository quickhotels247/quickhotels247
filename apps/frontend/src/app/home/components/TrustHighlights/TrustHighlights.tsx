import Box from "@mui/material/Box";
import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import SupportAgentOutlined from "@mui/icons-material/SupportAgentOutlined";
import VerifiedOutlined from "@mui/icons-material/VerifiedOutlined";
import TrustHighlightItem from "./TrustHighlightItem";
import { styles } from "./TrustHighlights.styles";

// Why book with us. Spec §4.1: only claims the business can back up, so get
// these confirmed before launch.
const highlights = [
  { icon: VerifiedOutlined, title: "Best Price", detail: "Guaranteed" },
  { icon: EventAvailableOutlined, title: "Easy Booking", detail: "& Cancellation" },
  { icon: SupportAgentOutlined, title: "24/7 Customer", detail: "Support" },
];

export default function TrustHighlights() {
  return (
    <Box component="section" aria-label="Why book with QuickHotels24/7" sx={styles.root}>
      {highlights.map((highlight) => (
        <TrustHighlightItem key={highlight.title} {...highlight} />
      ))}
    </Box>
  );
}
