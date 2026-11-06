import Link from "next/link";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import { styles } from "./BookingProblem.styles";

interface BookingProblemProps {
  problem: "signin" | "missing" | "error";
  message: string | null;
  // Where to come back after logging in.
  next: string;
}

// When a booking can't be shown: log in, not found, or an error.
export default function BookingProblem({ problem, message, next }: BookingProblemProps) {
  const copy = {
    signin: { title: "Log in to see this booking", text: "Bookings are private. Log in with the account you booked with.", action: "Log in", href: `${routes.login}?${new URLSearchParams({ next })}` },
    missing: { title: "We couldn't find this booking", text: "Check the reference, or that you're logged in with the account you booked with.", action: "My bookings", href: routes.myBookings },
    error: { title: "Something went wrong", text: message ?? "Please try again in a moment.", action: "My bookings", href: routes.myBookings },
  }[problem];
  return (
    <Container sx={styles.root}>
      <Typography component="h1" sx={styles.title}>
        {copy.title}
      </Typography>
      <Typography sx={styles.text}>{copy.text}</Typography>
      <Button variant="contained" component={Link} href={copy.href}>
        {copy.action}
      </Button>
    </Container>
  );
}
