import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LockOutlined from "@mui/icons-material/LockOutlined";
import type { CheckoutSummary } from "@quickhotels/types/checkout";
import { formatPrice } from "@/lib/format";
import { styles } from "./PaymentNext.styles";

interface PaymentNextProps {
  checkout: CheckoutSummary;
  onEdit: () => void;
}

// After guest details: who the booking is for, and the payment step. Online
// payment arrives with roadmap step 8, so "Pay" isn't live yet.
export default function PaymentNext({ checkout, onEdit }: PaymentNextProps) {
  const details = checkout.guestDetails;
  const lead = details?.rooms[0]?.guests[0];
  return (
    <Box sx={styles.root}>
      <Box sx={styles.card}>
        <Box sx={styles.header}>
          <Typography component="h2" sx={styles.title}>
            Guest details saved
          </Typography>
          <Button size="small" onClick={onEdit}>
            Edit
          </Button>
        </Box>
        {lead && (
          <Typography sx={styles.line}>
            Booking for <strong>{`${lead.title} ${lead.firstName} ${lead.lastName}`}</strong>
            {details!.rooms.flatMap((room) => room.guests).length > 1 ? ` and ${details!.rooms.flatMap((room) => room.guests).length - 1} more` : ""}
          </Typography>
        )}
        {details && (
          <Typography sx={styles.line}>
            Confirmation goes to {details.contact.email} · {details.contact.phoneCode} {details.contact.phone}
          </Typography>
        )}
      </Box>

      <Box sx={styles.card}>
        <Typography component="h2" sx={styles.title}>
          Payment
        </Typography>
        <Alert severity="info" sx={styles.alert}>
          Online payment is being set up and opens here soon. Nothing has been charged and your room isn&apos;t booked yet.
        </Alert>
        <Button variant="contained" size="large" startIcon={<LockOutlined />} disabled fullWidth>
          Pay {formatPrice(checkout.room.totalPrice)} securely
        </Button>
        <Typography sx={styles.note}>
          Payment and the hotel&apos;s confirmation are separate steps: we&apos;ll show your booking as confirmed only once
          the hotel confirms it.
        </Typography>
      </Box>
    </Box>
  );
}
