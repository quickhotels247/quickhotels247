import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { styles } from "./StepIndicator.styles";

const LABELS = ["Your details", "Password", "Verify email"];

// Where the visitor is in sign-up.
export default function StepIndicator({ current }: { current: number }) {
  return (
    <Stepper activeStep={current} alternativeLabel sx={styles.root} aria-label="Sign-up steps">
      {LABELS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
