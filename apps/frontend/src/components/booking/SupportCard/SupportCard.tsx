import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import { CONTACT_EMAIL } from "@/config/site";
import { styles } from "./SupportCard.styles";

// Voucher (once the hotel has confirmed and one exists) and support, with
// the booking reference filled in (spec §4.6, §4.8).
export default function SupportCard({ reference, voucherReady }: { reference: string; voucherReady: boolean }) {
  const mail = `mailto:${CONTACT_EMAIL}?${new URLSearchParams({ subject: `Booking ${reference}` }).toString().replace(/\+/g, "%20")}`;
  return (
    <Box component="section" aria-labelledby="support-title" sx={styles.root}>
      <Typography component="h2" id="support-title" sx={styles.title}>
        Need help?
      </Typography>
      <Typography sx={styles.text}>
        Quote your booking reference <strong>{reference}</strong> and we&apos;ll get back to you.
      </Typography>
      <Button variant="outlined" startIcon={<MailOutlineRounded />} href={mail} fullWidth>
        Contact support
      </Button>
      <Button variant="text" startIcon={<DownloadOutlined />} disabled fullWidth>
        {voucherReady ? "Voucher coming soon" : "Voucher not yet available"}
      </Button>
    </Box>
  );
}
