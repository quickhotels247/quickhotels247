"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import { CONTACT_EMAIL } from "@/config/site";
import { styles } from "./SupportCard.styles";

interface SupportCardProps {
  reference: string;
  voucherReady: boolean;
  // Downloads the PDF voucher (once the hotel has confirmed).
  onDownloadVoucher?: () => Promise<void>;
}

// Voucher (once the hotel has confirmed) and support, with the booking
// reference filled in (spec §4.6, §4.8).
export default function SupportCard({ reference, voucherReady, onDownloadVoucher }: SupportCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mail = `mailto:${CONTACT_EMAIL}?${new URLSearchParams({ subject: `Booking ${reference}` }).toString().replace(/\+/g, "%20")}`;
  const ready = voucherReady && Boolean(onDownloadVoucher);
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
      <Button
        variant="text"
        startIcon={<DownloadOutlined />}
        disabled={!ready || busy}
        fullWidth
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await onDownloadVoucher?.();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "The voucher didn't download. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Preparing voucher…" : ready ? "Download voucher (PDF)" : "Voucher once the hotel confirms"}
      </Button>
      {error && (
        <Typography role="alert" sx={styles.error}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
