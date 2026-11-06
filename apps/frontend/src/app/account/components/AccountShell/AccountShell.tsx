import type { ReactNode } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import RequireAuth from "@/components/auth/RequireAuth";
import AccountTabs from "../AccountTabs";
import { styles } from "./AccountShell.styles";

interface AccountShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

// Frame for account pages: signed-in only, page title, the section tabs.
export default function AccountShell({ title, subtitle, children }: AccountShellProps) {
  return (
    <RequireAuth>
      <Container maxWidth="md" sx={styles.root}>
        <Typography component="h1" sx={styles.title}>
          {title}
        </Typography>
        <AccountTabs />
        {subtitle && <Typography sx={styles.subtitle}>{subtitle}</Typography>}
        {children}
      </Container>
    </RequireAuth>
  );
}
