"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AddBoxOutlined from "@mui/icons-material/AddBoxOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import { SITE_NAME } from "@/config/site";
import { routes } from "@/config/navigation";
import { styles } from "./InstallAppPrompt.styles";

// Chrome's install event (not in TypeScript's DOM types yet).
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Shown once per device, whatever the visitor chooses.
const SEEN_KEY = "qh.installPromptSeen";
// Give the page a moment before asking.
const DELAY_MS = 4000;
// Never interrupt paying, a booking or the admin console.
const QUIET_PATHS = [routes.checkout, routes.booking, routes.flightBooking, routes.admin];

const isPhone = () => window.matchMedia("(max-width: 899px) and (pointer: coarse)").matches;
const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// "Get the app" sheet on phones, once: Android (Chrome) installs with one tap;
// iPhone can't be installed from a page, so it shows Share → Add to Home Screen.
export default function InstallAppPrompt() {
  const pathname = usePathname();
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const quiet = QUIET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (quiet || localStorage.getItem(SEEN_KEY) || isInstalled() || !isPhone()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (next: "android" | "ios") => {
      timer = setTimeout(() => {
        localStorage.setItem(SEEN_KEY, new Date().toISOString());
        setMode(next);
      }, DELAY_MS);
    };
    if (isIos()) {
      show("ios");
      return () => clearTimeout(timer);
    }
    // Chrome fires this when the site can be installed (not again once it is).
    const onInstallable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      show("android");
    };
    window.addEventListener("beforeinstallprompt", onInstallable);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallable);
      clearTimeout(timer);
    };
  }, [quiet]);

  const close = () => setMode(null);
  const install = async () => {
    if (!installEvent) return close();
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    close();
  };

  return (
    <Drawer anchor="bottom" open={mode !== null && !quiet} onClose={close} slotProps={{ paper: { sx: styles.sheet } }}>
      <IconButton aria-label="Close" onClick={close} sx={styles.close}>
        <CloseRounded />
      </IconButton>
      <Box sx={styles.head}>
        <Box component="img" src="/icons/icon-192.png" alt="" sx={styles.icon} />
        <Box>
          <Typography component="h2" sx={styles.title}>
            Get the {SITE_NAME} app
          </Typography>
          <Typography sx={styles.text}>Faster booking, one tap from your home screen. Free, no store needed.</Typography>
        </Box>
      </Box>

      {mode === "ios" ? (
        <Box component="ol" sx={styles.steps}>
          <li>
            Tap <IosShareRounded sx={styles.inlineIcon} aria-label="Share" /> <strong>Share</strong> in the browser bar
          </li>
          <li>
            Choose <AddBoxOutlined sx={styles.inlineIcon} aria-hidden /> <strong>Add to Home Screen</strong>
          </li>
          <li>
            Tap <strong>Add</strong>
          </li>
        </Box>
      ) : null}

      <Box sx={styles.actions}>
        <Button onClick={close} sx={styles.later}>
          {mode === "ios" ? "Got it" : "Not now"}
        </Button>
        {mode === "android" && (
          <Button variant="contained" onClick={install} sx={styles.install}>
            Install app
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
