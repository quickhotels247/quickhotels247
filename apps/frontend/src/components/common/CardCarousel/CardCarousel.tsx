"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { styles } from "./CardCarousel.styles";

interface CardCarouselProps {
  // Accessible name for the list, e.g. "Destinations in India".
  label: string;
  // Card width on phones / tablets / desktop, as CSS values.
  itemWidth?: { xs: string; sm?: string; md?: string };
  children: ReactNode;
}

// A row of cards that scrolls sideways: swipe on touch screens, arrow buttons
// on desktop (only when there is more to see). Cards snap to the page margin.
export default function CardCarousel({
  label,
  itemWidth = { xs: "72%", sm: "40%", md: "23.5%" },
  children,
}: CardCarouselProps) {
  const track = useRef<HTMLUListElement>(null);
  // Which arrows are useful: none when every card fits, one at each end.
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () =>
      setCanScroll({
        left: element.scrollLeft > 4,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
      });
    update();
    element.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, []);

  function scroll(direction: 1 | -1) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <Box sx={styles.root}>
      <Box component="ul" ref={track} aria-label={label} sx={styles.track(itemWidth)}>
        {Children.map(children, (child) => (
          <Box component="li" sx={styles.item}>
            {child}
          </Box>
        ))}
      </Box>
      {canScroll.left && (
        <IconButton aria-label={`Scroll ${label} left`} onClick={() => scroll(-1)} sx={styles.arrow("left")}>
          <ChevronLeftRounded />
        </IconButton>
      )}
      {canScroll.right && (
        <IconButton aria-label={`Scroll ${label} right`} onClick={() => scroll(1)} sx={styles.arrow("right")}>
          <ChevronRightRounded />
        </IconButton>
      )}
    </Box>
  );
}
