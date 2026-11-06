import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { styles } from "./CheckoutSteps.styles";

const STEPS = ["Guest details", "Payment", "Confirmation"];

interface CheckoutStepsProps {
  // 0-based index of the current step.
  active: number;
}

// Guest details → Payment → Confirmation (spec §4.4).
export default function CheckoutSteps({ active }: CheckoutStepsProps) {
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
