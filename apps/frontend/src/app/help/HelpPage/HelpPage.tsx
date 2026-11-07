import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import { CONTACT_EMAIL } from "@/config/site";
import ContactForm from "../components/ContactForm";
import FaqSection from "../components/FaqSection";
import { FAQ_GROUPS } from "../data/faqs";
import { styles } from "./HelpPage.styles";

// Help & support: common questions, then a contact form (creates a ticket).
export default function HelpPage() {
  return (
    <>
      <Box sx={styles.band}>
        <Container maxWidth="md">
          <Typography component="h1" sx={styles.title}>
            How can we help?
          </Typography>
          <Typography sx={styles.subtitle}>Answers to common questions about bookings, cancellations and payments.</Typography>
          <Box component="nav" aria-label="Help topics" sx={styles.chips}>
            {FAQ_GROUPS.map((group) => (
              <Box key={group.id} component="a" href={`#${group.id}`} sx={styles.chip}>
                {group.title}
              </Box>
            ))}
            <Box component="a" href="#contact" sx={[styles.chip, styles.chipPrimary]}>
              Contact us
            </Box>
          </Box>
        </Container>
      </Box>
      <Container maxWidth="md" sx={styles.body}>
        {FAQ_GROUPS.map((group) => (
          <FaqSection key={group.id} group={group} />
        ))}
        <Box id="contact" sx={styles.contact}>
          <ContactForm />
          <Typography sx={styles.email}>
            <MailOutlineRounded fontSize="small" /> Prefer email? Write to <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>
          </Typography>
        </Box>
      </Container>
    </>
  );
}
