"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import { styles } from "./OtpInput.styles";

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  // Called once all six digits are filled in.
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

// Six single-digit boxes that behave like one field: typing advances,
// Backspace goes back, and pasting or email/SMS autofill fills them all.
export default function OtpInput({ value, onChange, onComplete, disabled, invalid = false, autoFocus }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (index: number) => inputs.current[Math.max(0, Math.min(index, LENGTH - 1))]?.focus();

  function update(next: string, focusIndex: number) {
    const clean = next.replace(/\D/g, "").slice(0, LENGTH);
    onChange(clean);
    focus(focusIndex);
    if (clean.length === LENGTH) onComplete?.(clean);
  }

  function handleInput(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    // Typing over a box replaces from there; autofill may deliver all six at once.
    const start = Math.min(index, value.length);
    update(value.slice(0, start) + digits + value.slice(start + digits.length), start + digits.length);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) update(value.slice(0, index) + value.slice(index + 1), index);
      else if (index > 0) update(value.slice(0, index - 1) + value.slice(index), index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(Math.min(index + 1, value.length));
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    update(digits, digits.length);
  }

  return (
    <Box sx={styles.root} role="group" aria-label="6-digit code">
      {Array.from({ length: LENGTH }, (_, index) => (
        <Box
          component="input"
          key={index}
          ref={(element: HTMLInputElement | null) => {
            inputs.current[index] = element;
          }}
          value={value[index] ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleInput(index, event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          // Keep the boxes filled in order: clicking ahead jumps to the next empty one.
          onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
            if (index > value.length) focus(value.length);
            else event.target.select();
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? LENGTH : 1}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          aria-invalid={invalid || undefined}
          sx={[styles.box, invalid && styles.invalid]}
        />
      ))}
    </Box>
  );
}
