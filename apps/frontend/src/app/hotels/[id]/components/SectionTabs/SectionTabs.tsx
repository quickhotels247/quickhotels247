import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { styles } from "./SectionTabs.styles";

export interface PageSection {
  id: string;
  label: string;
}

interface SectionTabsProps {
  sections: PageSection[];
}

// "Overview · Rooms · Facilities · Policies · Location": jumps down the page.
export default function SectionTabs({ sections }: SectionTabsProps) {
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <Box component="nav" aria-label="On this page" sx={styles.root}>
      {sections.map((section) => (
        <ButtonBase key={section.id} onClick={() => jump(section.id)} sx={styles.tab}>
          {section.label}
        </ButtonBase>
      ))}
    </Box>
  );
}
