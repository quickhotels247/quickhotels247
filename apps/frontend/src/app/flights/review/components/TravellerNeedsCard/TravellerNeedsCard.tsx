import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import type { FlightTravellerRequirements } from "@quickhotels/types/flight-checkout";
import { styles } from "./TravellerNeedsCard.styles";

// What the next step will ask for, so travellers can have it ready.
export default function TravellerNeedsCard({ requirements: needs }: { requirements: FlightTravellerRequirements }) {
  const dob = (["adult", "child", "infant"] as const).filter((type) => needs.dateOfBirth[type]);
  const items = [
    `Full names exactly as on each traveller's ID${needs.nameLimits ? ` (up to ${needs.nameLimits.first} letters for first and last names)` : ""}`,
    dob.length > 0 && `Date of birth for ${dob.map((type) => (type === "child" ? "children" : `${type}s`)).join(" and ")}`,
    needs.passport && `Passport number${needs.passportExpiry ? " and expiry date" : ""} for every traveller`,
    needs.pan && "PAN card details",
    needs.gst === "required" && "Your company's GST details",
    needs.gst === "optional" && "GST details, if you want a GST invoice (optional)",
    needs.emergencyContact && "An emergency contact",
    "An email and mobile number for your tickets",
  ].filter(Boolean) as string[];
  return (
    <Box component="section" aria-labelledby="needs-title" sx={styles.root}>
      <Typography component="h2" id="needs-title" sx={styles.heading}>
        <BadgeOutlined sx={styles.icon} aria-hidden="true" />
        What you&apos;ll need next
      </Typography>
      <Box component="ul" sx={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Box>
    </Box>
  );
}
