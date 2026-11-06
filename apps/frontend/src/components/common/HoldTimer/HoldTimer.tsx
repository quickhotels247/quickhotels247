"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import { styles } from "./HoldTimer.styles";

interface HoldTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

const secondsLeft = (expiresAt: string) => Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));

// "We're holding this price for 12:34", counting down; calls onExpire at zero.
export default function HoldTimer({ expiresAt, onExpire }: HoldTimerProps) {
  // Null until the browser has the clock, so server and browser render alike.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = secondsLeft(expiresAt);
      setLeft(next);
      if (next === 0) onExpire();
      return next;
    };
    if (tick() === 0) return;
    const timer = setInterval(() => tick() === 0 && clearInterval(timer), 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (left === null) return null;
  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, "0");
  return (
    <Box sx={[styles.root, left < 120 && styles.urgent]} role="timer" aria-live="off">
      <TimerOutlined sx={styles.icon} aria-hidden="true" />
      {left > 0 ? (
        <>
          We&apos;re holding this price for{" "}
          <Box component="strong" sx={styles.time}>
            {minutes}:{seconds}
          </Box>
        </>
      ) : (
        "This price hold has ended."
      )}
    </Box>
  );
}
