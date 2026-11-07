"use client";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import type { FaqGroup } from "../../data/faqs";
import { styles } from "./FaqSection.styles";

// One group of questions, each opening in place.
export default function FaqSection({ group }: { group: FaqGroup }) {
  return (
    <Box component="section" id={group.id} aria-labelledby={`faq-${group.id}`} sx={styles.root}>
      <Typography component="h2" id={`faq-${group.id}`} sx={styles.title}>
        {group.title}
      </Typography>
      {group.faqs.map((faq, i) => (
        <Accordion key={faq.question} disableGutters elevation={0} sx={styles.item}>
          <AccordionSummary expandIcon={<ExpandMoreRounded />} id={`faq-${group.id}-${i}`} aria-controls={`faq-${group.id}-${i}-answer`}>
            <Typography component="h3" sx={styles.question}>
              {faq.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails id={`faq-${group.id}-${i}-answer`}>
            <Typography sx={styles.answer}>{faq.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
