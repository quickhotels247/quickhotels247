import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import EventBusyOutlined from "@mui/icons-material/EventBusyOutlined";
import type { HotelImage, HotelRoomType, HotelRoomsResponse, RoomOption } from "@quickhotels/types/hotels";
import RoomTypeGroup from "./RoomTypeGroup";
import { styles } from "./RoomOptions.styles";

interface RoomOptionsProps {
  rooms: HotelRoomsResponse | null;
  loading: boolean;
  error: string | null;
  // False until the stay can be priced (e.g. a child's age is missing).
  ready: boolean;
  roomTypes: HotelRoomType[];
  // The hotel's photos, for room photos when a room type has none.
  hotelImages: HotelImage[];
  stayLabel: string;
  reserveHref: (option: RoomOption) => string | null;
  onRetry: () => void;
  onChangeStay: () => void;
}

interface Group {
  key: string;
  name: string;
  roomType: HotelRoomType | null;
  options: RoomOption[];
}

// Rates grouped by room type, cheapest room first (options arrive cheapest first).
function groupRooms(options: RoomOption[], roomTypes: HotelRoomType[]): Group[] {
  const groups = new Map<string, Group>();
  for (const option of options) {
    const roomType = roomTypes.find((type) => type.id === option.roomTypeId) ?? null;
    const key = roomType?.id ?? option.roomName.toLowerCase();
    const group = groups.get(key) ?? { key, name: roomType?.name ?? option.roomName, roomType, options: [] };
    group.options.push(option);
    groups.set(key, group);
  }
  return [...groups.values()];
}

// Hotel photos the supplier tagged as rooms ("Room", "Guestroom", "Suite"…).
const ROOM_CAPTION = /\b(room|guestroom|bedroom|suite)\b/i;
const NOT_A_ROOM = /\b(bath|living|meeting|dining|lobby|banquet|fitness|conference)/i;

// "Availability": live rooms and rates, with loading, error and sold-out states.
export default function RoomOptions({
  rooms,
  loading,
  error,
  ready,
  roomTypes,
  hotelImages,
  stayLabel,
  reserveHref,
  onRetry,
  onChangeStay,
}: RoomOptionsProps) {
  if (!ready) {
    return <Alert severity="info">Choose your dates and guests above to see rooms and prices.</Alert>;
  }
  if (loading && !rooms) {
    return (
      <Box sx={styles.list} aria-busy="true">
        <Typography sx={styles.loading} role="status">
          Checking live prices with the hotel…
        </Typography>
        {[0, 1].map((i) => (
          <Skeleton key={i} variant="rounded" height={180} sx={styles.skeleton} />
        ))}
      </Box>
    );
  }
  if (error && !rooms) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Try again</Button>}>
        {error}
      </Alert>
    );
  }
  if (!rooms?.options.length) {
    return (
      <Box sx={styles.empty}>
        <EventBusyOutlined sx={styles.emptyIcon} aria-hidden="true" />
        <Typography component="h3" sx={styles.emptyTitle}>
          No rooms available for these dates
        </Typography>
        <Typography sx={styles.emptyText}>This hotel is sold out or not taking bookings for your stay. Try other dates.</Typography>
        <Button variant="contained" onClick={onChangeStay}>
          Change dates
        </Button>
      </Box>
    );
  }
  const groups = groupRooms(rooms.options, roomTypes);
  const roomPhotos = hotelImages.filter((image) => image.caption && ROOM_CAPTION.test(image.caption) && !NOT_A_ROOM.test(image.caption));
  return (
    <Box sx={[styles.list, loading && styles.refreshing]} aria-busy={loading}>
      {rooms.sample && <Alert severity="warning">These are sample rates for testing, not live TripJack prices.</Alert>}
      {groups.map((group, index) => (
        <RoomTypeGroup
          key={group.key}
          name={group.name}
          roomType={group.roomType}
          // The room type's own photo, else a different hotel room photo per card.
          photo={
            group.roomType?.images[0]
              ? { url: group.roomType.images[0].url, exact: true }
              : roomPhotos.length
                ? { url: roomPhotos[index % roomPhotos.length]!.url, exact: false }
                : null
          }
          options={group.options}
          stayLabel={stayLabel}
          reserveHref={reserveHref}
        />
      ))}
      <Typography sx={styles.footnote}>
        Prices are live and include taxes and fees. They&apos;re checked again before you pay.
      </Typography>
    </Box>
  );
}
