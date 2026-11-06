import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How QuickHotels24/7 handles your personal information.",
};

// Placeholder until our privacy policy are written and legally reviewed.
export default function Page() {
  return (
    <LegalPage title="Privacy Policy">
      <Alert severity="info">The full Privacy Policy is being prepared and will be published here before launch.</Alert>
      <Typography>
        Questions in the meantime? Email{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
      </Typography>
    </LegalPage>
  );
}
