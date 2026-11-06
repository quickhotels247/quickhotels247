"use client";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import type { FaqEntry } from "../../../data/types";
import { styles } from "./FaqItem.styles";

interface FaqItemProps {
  faq: FaqEntry;
}

export default function FaqItem({ faq }: FaqItemProps) {
  return (
    <Accordion disableGutters elevation={0} sx={styles.root}>
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        id={`faq-${faq.id}-question`}
        aria-controls={`faq-${faq.id}-answer`}
        sx={styles.summary}
      >
        <Typography component="h3" sx={styles.question}>
          {faq.question}
        </Typography>
      </AccordionSummary>
      <AccordionDetails id={`faq-${faq.id}-answer`} sx={styles.details}>
        <Typography sx={styles.answer}>{faq.answer}</Typography>
      </AccordionDetails>
    </Accordion>
  );
}
