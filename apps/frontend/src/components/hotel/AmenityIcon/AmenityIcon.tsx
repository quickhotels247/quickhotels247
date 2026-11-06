import type { SvgIconProps } from "@mui/material/SvgIcon";
import AcUnitRounded from "@mui/icons-material/AcUnitRounded";
import AccessibleRounded from "@mui/icons-material/AccessibleRounded";
import AirportShuttleRounded from "@mui/icons-material/AirportShuttleRounded";
import BeachAccessRounded from "@mui/icons-material/BeachAccessRounded";
import EvStationRounded from "@mui/icons-material/EvStationRounded";
import FamilyRestroomRounded from "@mui/icons-material/FamilyRestroomRounded";
import FitnessCenterRounded from "@mui/icons-material/FitnessCenterRounded";
import KitchenRounded from "@mui/icons-material/KitchenRounded";
import LocalBarRounded from "@mui/icons-material/LocalBarRounded";
import LocalParkingRounded from "@mui/icons-material/LocalParkingRounded";
import PetsRounded from "@mui/icons-material/PetsRounded";
import PoolRounded from "@mui/icons-material/PoolRounded";
import RestaurantRounded from "@mui/icons-material/RestaurantRounded";
import RoomServiceRounded from "@mui/icons-material/RoomServiceRounded";
import SpaRounded from "@mui/icons-material/SpaRounded";
import WifiRounded from "@mui/icons-material/WifiRounded";
import type { HotelAmenity } from "@quickhotels/types/hotels";
import { styles } from "./AmenityIcon.styles";

const ICONS: Record<HotelAmenity, typeof WifiRounded> = {
  wifi: WifiRounded,
  parking: LocalParkingRounded,
  pool: PoolRounded,
  spa: SpaRounded,
  gym: FitnessCenterRounded,
  restaurant: RestaurantRounded,
  bar: LocalBarRounded,
  roomService: RoomServiceRounded,
  airportShuttle: AirportShuttleRounded,
  airConditioning: AcUnitRounded,
  kitchen: KitchenRounded,
  petFriendly: PetsRounded,
  familyRooms: FamilyRestroomRounded,
  wheelchair: AccessibleRounded,
  evCharging: EvStationRounded,
  beach: BeachAccessRounded,
};

interface AmenityIconProps extends SvgIconProps {
  amenity: HotelAmenity;
}

// The icon for one of our filterable amenities (decorative: pair it with a label).
export default function AmenityIcon({ amenity, ...props }: AmenityIconProps) {
  const Icon = ICONS[amenity];
  return <Icon aria-hidden="true" sx={styles.icon} {...props} />;
}
