import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { styles } from "./BookingSteps.styles";

const STEPS = ["Review fare", "Travellers", "Payment"];

// Review fare → Travellers → Payment.
export default function BookingSteps({ active }: { active: number }) {
  return (
    <Stepper activeStep={active} alternativeLabel sx={styles.root} aria-label="Booking steps">
      {STEPS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
