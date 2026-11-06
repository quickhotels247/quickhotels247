import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, TERMS_VERSION } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for booking hotels with QuickHotels24/7.",
};

// Placeholder until our booking terms are written and legally reviewed.
export default function Page() {
  return (
    <LegalPage title="Terms of Service" version={TERMS_VERSION}>
      <Alert severity="info">The full Terms of Service is being prepared and will be published here before launch.</Alert>
      <Typography>
        Questions in the meantime? Email{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
      </Typography>
    </LegalPage>
  );
}
