import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LockOutlined from "@mui/icons-material/LockOutlined";
import type { FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import { formatPrice } from "@/lib/format";
import { styles } from "./PaymentStep.styles";

interface PaymentStepProps {
  review: FlightReviewSummary;
  onEdit: () => void;
}

// After travellers: who's flying and where tickets go, then payment. Online
// payment and ticketing arrive with flights step F6, so "Pay" isn't live yet.
export default function PaymentStep({ review, onEdit }: PaymentStepProps) {
  const details = review.travellerDetails;
  return (
    <Box sx={styles.root}>
      <Box sx={styles.card}>
        <Box sx={styles.header}>
          <Typography component="h2" sx={styles.title}>
            Travellers
          </Typography>
          <Button size="small" onClick={onEdit}>
            Edit
          </Button>
        </Box>
        <Box component="ul" sx={styles.list}>
          {details?.travellers.map((traveller, i) => (
            <li key={i}>
              {traveller.title} {traveller.firstName} {traveller.lastName}
              <Box component="span" sx={styles.type}>
                {" "}
                · {traveller.type}
              </Box>
            </li>
          ))}
        </Box>
        {details && (
          <Typography sx={styles.line}>
            Tickets go to {details.contact.email} · {details.contact.phoneCode} {details.contact.phone}
          </Typography>
        )}
      </Box>
      <Box sx={styles.card}>
        <Typography component="h2" sx={styles.title}>
          Payment
        </Typography>
        <Alert severity="info" sx={styles.alert}>
          Online payment and ticketing are being set up and open here soon. Nothing has been charged and no tickets have been issued.
        </Alert>
        <Button variant="contained" size="large" startIcon={<LockOutlined />} disabled fullWidth>
          Pay {formatPrice(review.payable)} securely
        </Button>
        <Typography sx={styles.note}>We&apos;ll show your booking as confirmed only once the airline issues your tickets.</Typography>
      </Box>
    </Box>
  );
}
