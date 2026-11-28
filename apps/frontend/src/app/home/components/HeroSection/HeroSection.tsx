"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import HotelSearchBar from "@/components/search/HotelSearchBar";
import { routes } from "@/config/navigation";
import type { Season } from "../../data/seasons";
import { styles } from "./HeroSection.styles";

interface HeroSectionProps {
  season: Season;
}

// A new photo this often.
const SLIDE_MS = 5000;

// The season's photos sliding on by themselves, one fading into the next,
// behind its headline and the hotel search bar. It holds still only while
// someone is typing in the search bar (and in a background tab); for visitors
// who ask for less motion the photos change without the fade.
export default function HeroSection({ season }: HeroSectionProps) {
  const { slides } = season;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => {
      // Not while the tab is in the background.
      if (!document.hidden) setIndex((current) => (current + 1) % slides.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
    // index: a dot click starts the next interval afresh.
  }, [paused, slides.length, index]);

  const slide = slides[index]!;
  const href = `${routes.hotels}?${new URLSearchParams({ destination: slide.destination })}`;

  return (
    <Container sx={styles.outer}>
      <Box
        component="section"
        aria-labelledby="hero-title"
        aria-roledescription="carousel"
        sx={styles.root}
      >
        {slides.map((item, i) => (
          <Box
            key={`${item.caption}-${i}`}
            sx={[styles.slide, i === index && styles.slideShown, reducedMotion && styles.noFade]}
            aria-hidden={i !== index}
          >
            <Image
              src={item.imageUrl}
              alt={i === index ? item.caption : ""}
              fill
              priority={i === 0}
              sizes="(max-width: 1200px) 100vw, 1200px"
              style={{ objectFit: "cover" }}
            />
          </Box>
        ))}
        <Box sx={styles.shade} aria-hidden="true" />

        <Box component={Link} href={href} sx={styles.caption} aria-live={paused ? "off" : "polite"}>
          {slide.caption}
          <Typography component="span" sx={styles.captionLink}>
            See hotels in {slide.destination}
            <ArrowForwardRounded sx={styles.captionIcon} />
          </Typography>
        </Box>

        <Box sx={styles.content}>
          <Typography sx={styles.season}>
            {season.label} · {season.months}
          </Typography>
          <Typography id="hero-title" variant="h1" sx={styles.title}>
            {season.headline}
          </Typography>
          <Typography sx={styles.subtitle}>{season.subtitle}</Typography>
          <Box
            sx={styles.search}
            onFocusCapture={(event) => event.target instanceof HTMLInputElement && setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <HotelSearchBar />
          </Box>
          {slides.length > 1 && (
            <Box sx={styles.dots} role="group" aria-label="Choose a photo">
              {slides.map((item, i) => (
                <ButtonBase
                  key={`${item.caption}-dot-${i}`}
                  aria-label={item.caption}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  sx={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}
