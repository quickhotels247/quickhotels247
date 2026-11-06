import Box from "@mui/material/Box";
import CompareArrowsRounded from "@mui/icons-material/CompareArrowsRounded";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import SupportAgentOutlined from "@mui/icons-material/SupportAgentOutlined";
import WhyBookItem from "./WhyBookItem";
import { styles } from "./WhyBookFlights.styles";

// Spec §4.1: only claims we can keep. Confirm the support wording before launch.
const reasons = [
  { icon: CompareArrowsRounded, title: "Compare fares in one place", text: "Search many airlines at once and pick the flight that suits you." },
  { icon: ReceiptLongOutlined, title: "See the full price", text: "Taxes and fees are shown before you pay, with the fare rules for your ticket." },
  { icon: SupportAgentOutlined, title: "Help with your booking", text: "Contact our team about changes, cancellations and refunds." },
];

export default function WhyBookFlights() {
  return (
    <Box component="section" aria-label="Why book flights with QuickHotels24/7" sx={styles.root}>
      {reasons.map((reason) => (
        <WhyBookItem key={reason.title} {...reason} />
      ))}
    </Box>
  );
}
