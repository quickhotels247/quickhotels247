"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import MuiLink from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { HotelSearchCriteria, RoomOption } from "@quickhotels/types/hotels";
import { criteriaFromParams, criteriaParams, searchUrl, validateCriteria } from "@/components/search/HotelSearchBar/searchCriteria";
import { routes } from "@/config/navigation";
import HotelFacilities from "../components/HotelFacilities";
import HotelHeader from "../components/HotelHeader";
import HotelLocation from "../components/HotelLocation";
import HotelOverview from "../components/HotelOverview";
import HotelPolicies from "../components/HotelPolicies";
import PhotoGallery from "../components/PhotoGallery";
import RoomOptions from "../components/RoomOptions";
import SectionTabs from "../components/SectionTabs";
import type { PageSection } from "../components/SectionTabs/SectionTabs";
import StayBar from "../components/StayBar";
import { useHotelDetails } from "../hooks/useHotelDetails";
import { useHotelRooms } from "../hooks/useHotelRooms";
import { styles } from "./HotelDetailsPage.styles";

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

// The hotel page (spec §4.3): photos, overview, live rooms and rates for the
// visitor's stay, facilities, policies and location. The stay lives in the
// URL; searchId (from the results page) keeps that search's supplier session.
export default function HotelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomsTop = useRef<HTMLDivElement>(null);

  const stay = useMemo(() => criteriaFromParams(params), [params]);
  const searchId = params.get("searchId");
  // Only dates and guests matter here; the hotel is the destination.
  const { destination: _destination, ...problems } = validateCriteria({ ...stay, destination: "-" });
  const ready = !Object.keys(problems).length;

  const details = useHotelDetails(id);
  const rooms = useHotelRooms(id, ready ? stay : null, searchId);
  const hotel = details.data;

  const showRooms = () => roomsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  // A new stay prices afresh, so the old search session no longer applies.
  const changeStay = (next: HotelSearchCriteria) => router.replace(`${pathname}?${criteriaParams({ ...next, destination: "" })}`, { scroll: false });

  const nights = rooms.data?.nights ?? 0;
  const guests = [plural(stay.adults, "adult"), stay.children > 0 && plural(stay.children, "child", "children")].filter(Boolean).join(", ");
  const stayLabel = `${plural(nights, "night")}, ${guests}${stay.rooms > 1 ? `, ${plural(stay.rooms, "room")}` : ""}`;
  const roomsId = rooms.data?.roomsId ?? null;
  const reserveHref = (option: RoomOption) => {
    if (!roomsId) return null;
    const query = criteriaParams({ ...stay, destination: "" });
    query.delete("destination");
    query.set("hotelId", id);
    query.set("roomsId", roomsId);
    query.set("optionId", option.id);
    return `${routes.checkout}?${query}`;
  };

  if (details.error && !hotel) {
    const gone = /isn't available/.test(details.error);
    return (
      <Container sx={styles.missing}>
        <Typography component="h1" sx={styles.missingTitle}>
          {gone ? "This hotel isn't available" : "We couldn't load this hotel"}
        </Typography>
        <Typography sx={styles.missingText}>{details.error}</Typography>
        <Button variant="contained" component={Link} href={routes.home}>
          Search hotels
        </Button>
      </Container>
    );
  }

  const sections: PageSection[] = [
    { id: "overview", label: "Overview" },
    { id: "rooms", label: "Rooms & prices" },
    ...(hotel?.facilities.length ? [{ id: "facilities", label: "Facilities" }] : []),
    { id: "policies", label: "House rules" },
    { id: "location", label: "Location" },
  ];
  const fromPrice = rooms.data?.options[0]?.pricePerNight ?? null;

  return (
    <Container sx={styles.page}>
      {hotel ? (
        <>
          <Breadcrumbs aria-label="Breadcrumb" sx={styles.crumbs}>
            <MuiLink component={Link} href={routes.home} underline="hover" color="inherit">
              Home
            </MuiLink>
            {hotel.city && (
              <MuiLink component={Link} href={searchUrl({ ...stay, destination: hotel.city })} underline="hover" color="inherit">
                Hotels in {hotel.city}
              </MuiLink>
            )}
            <Typography sx={styles.crumbCurrent}>{hotel.name}</Typography>
          </Breadcrumbs>
          <HotelHeader hotel={hotel} fromPrice={fromPrice ? { ...fromPrice, amount: Math.round(fromPrice.amount) } : null} roomsLoading={ready && rooms.loading} onReserve={showRooms} />
          <PhotoGallery images={hotel.images} hotelName={hotel.name} />
          <SectionTabs sections={sections} />
        </>
      ) : (
        <Box aria-busy="true">
          <Skeleton width="50%" height={48} />
          <Skeleton width="70%" />
          <Skeleton variant="rounded" height={408} sx={styles.galleryLoading} />
        </Box>
      )}

      <Box component="section" id="overview" aria-labelledby="overview-title" sx={styles.section}>
        <Typography component="h2" id="overview-title" sx={styles.title}>
          Overview
        </Typography>
        {hotel ? <HotelOverview hotel={hotel} /> : <Skeleton variant="rounded" height={160} />}
      </Box>

      <Box component="section" id="rooms" ref={roomsTop} aria-labelledby="rooms-title" sx={styles.section}>
        <Typography component="h2" id="rooms-title" sx={styles.title}>
          Rooms & prices
        </Typography>
        <Box sx={styles.stayBar}>
          <StayBar stay={stay} onChange={changeStay} />
        </Box>
        <RoomOptions
          rooms={rooms.data}
          loading={rooms.loading}
          error={rooms.error}
          ready={ready}
          roomTypes={hotel?.roomTypes ?? []}
          hotelImages={hotel?.images ?? []}
          stayLabel={stayLabel}
          reserveHref={reserveHref}
          onRetry={rooms.retry}
          onChangeStay={showRooms}
        />
      </Box>

      {hotel && hotel.facilities.length > 0 && (
        <Box component="section" id="facilities" aria-labelledby="facilities-title" sx={styles.section}>
          <Typography component="h2" id="facilities-title" sx={styles.title}>
            Facilities
          </Typography>
          <HotelFacilities facilities={hotel.facilities} />
        </Box>
      )}

      {hotel && (
        <>
          <Box component="section" id="policies" aria-labelledby="policies-title" sx={styles.section}>
            <Typography component="h2" id="policies-title" sx={styles.title}>
              House rules
            </Typography>
            <HotelPolicies hotel={hotel} />
          </Box>
          <Box component="section" id="location" aria-labelledby="location-title" sx={styles.section}>
            <Typography component="h2" id="location-title" sx={styles.title}>
              Location
            </Typography>
            <HotelLocation hotel={hotel} />
          </Box>
        </>
      )}
    </Container>
  );
}
