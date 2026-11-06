import Box from "@mui/material/Box";
import SectionHeader from "@/components/common/SectionHeader";
import type { FaqEntry } from "../../data/types";
import FaqItem from "./FaqItem";
import { styles } from "./FlightsFaq.styles";

interface FlightsFaqProps {
  faqs: FaqEntry[];
}

// Questions in two columns of expandable answers (one column on phones).
export default function FlightsFaq({ faqs }: FlightsFaqProps) {
  if (!faqs.length) return null;
  const half = Math.ceil(faqs.length / 2);
  const columns = [faqs.slice(0, half), faqs.slice(half)];
  return (
    <Box component="section" aria-labelledby="flights-faq">
      <SectionHeader id="flights-faq" title="Frequently asked questions" />
      <Box sx={styles.grid}>
        {columns.map((column, index) => (
          <Box key={index} sx={styles.column}>
            {column.map((faq) => (
              <FaqItem key={faq.id} faq={faq} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
