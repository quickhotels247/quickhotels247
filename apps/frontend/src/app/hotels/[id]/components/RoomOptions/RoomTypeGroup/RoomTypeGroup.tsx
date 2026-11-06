"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import BedOutlined from "@mui/icons-material/BedOutlined";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import SquareFootRounded from "@mui/icons-material/SquareFootRounded";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import type { HotelRoomType, RoomOption } from "@quickhotels/types/hotels";
import HotelPhoto from "@/components/hotel/HotelPhoto";
import RateRow from "../RateRow";
import { styles } from "./RoomTypeGroup.styles";

interface RoomTypeGroupProps {
  name: string;
  // The room's content, when the supplier links it to these rates.
  roomType: HotelRoomType | null;
  // `exact` is false for a general photo of the hotel's rooms.
  photo: { url: string; exact: boolean } | null;
  options: RoomOption[];
  stayLabel: string;
  reserveHref: (option: RoomOption) => string | null;
}

const RATES_SHOWN = 3;

// One room type: its photo and features on the left, its rates on the right.
export default function RoomTypeGroup({ name, roomType, photo, options, stayLabel, reserveHref }: RoomTypeGroupProps) {
  const [all, setAll] = useState(false);
  const shown = all ? options : options.slice(0, RATES_SHOWN);
  const features = [
    roomType?.beds && { icon: <BedOutlined />, text: roomType.beds },
    roomType?.areaSqM && { icon: <SquareFootRounded />, text: `${roomType.areaSqM} m²` },
    roomType?.maxGuests && { icon: <PeopleOutlineRounded />, text: `Sleeps ${roomType.maxGuests}` },
    roomType?.views.length && { icon: <VisibilityOutlined />, text: roomType.views.slice(0, 2).join(", ") },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <Box component="article" sx={styles.root}>
      <Box sx={styles.room}>
        {photo && (
          <Box sx={styles.photo}>
            <HotelPhoto src={photo.url} alt={photo.exact ? name : `A room at this hotel`} sizes="(max-width: 900px) 100vw, 280px" />
            {!photo.exact && <Box sx={styles.photoNote}>Photo may show a different room</Box>}
          </Box>
        )}
        <Typography component="h3" sx={styles.name}>
          {name}
        </Typography>
        {features.length > 0 && (
          <Box component="ul" sx={styles.features}>
            {features.map((feature) => (
              <Box component="li" key={feature.text} sx={styles.feature}>
                {feature.icon}
                {feature.text}
              </Box>
            ))}
          </Box>
        )}
        {roomType && roomType.amenities.length > 0 && (
          <Typography sx={styles.amenities}>{roomType.amenities.slice(0, 6).join(" · ")}</Typography>
        )}
      </Box>
      <Box sx={styles.rates}>
        {shown.map((option) => (
          <RateRow key={option.id} option={option} stayLabel={stayLabel} reserveHref={reserveHref(option)} />
        ))}
        {options.length > RATES_SHOWN && (
          <Button onClick={() => setAll((open) => !open)} sx={styles.more}>
            {all ? "Show fewer rates" : `Show ${options.length - RATES_SHOWN} more rates`}
          </Button>
        )}
      </Box>
    </Box>
  );
}
