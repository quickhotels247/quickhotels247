import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { CheckoutGuest, CheckoutRoomGuests } from "@quickhotels/types/checkout";
import type { SavedTraveller } from "@quickhotels/types/travellers";
import SavedTravellerPicker from "@/components/forms/SavedTravellerPicker";
import { travellerKey } from "@/lib/hooks/useSavedTravellers";
import { guestFromSaved, isChild, type FormErrors } from "../../../utils/guestForm";
import GuestRow from "./GuestRow";
import { guestLabel } from "./GuestRow/GuestRow";
import { styles } from "./RoomGuests.styles";

interface RoomGuestsProps {
  index: number;
  room: CheckoutRoomGuests;
  roomName: string;
  showRoomTitle: boolean;
  guests: CheckoutGuest[];
  needsPan: boolean;
  needsPassport: boolean;
  errors: FormErrors;
  onChange: (guests: CheckoutGuest[]) => void;
  // The customer's saved travellers, and names used anywhere on the form.
  saved: SavedTraveller[];
  takenNames: string[];
}

// The guests staying in one room, as the hotel will expect them.
export default function RoomGuests({ index, room, roomName, showRoomTitle, guests, needsPan, needsPassport, errors, onChange, saved, takenNames }: RoomGuestsProps) {
  return (
    <Box sx={styles.root}>
      {showRoomTitle && (
        <Typography component="h3" sx={styles.title}>
          Room {index + 1} · {roomName}
        </Typography>
      )}
      {guests.map((guest, g) => {
        const child = isChild(room, g);
        const childAge = child ? room.childAges[g - room.adults]! : null;
        const own = travellerKey(guest.firstName, guest.lastName);
        return (
        <GuestRow
          key={g}
          room={index}
          index={g}
          guest={guest}
          childAge={childAge}
          needsPan={needsPan}
          needsPassport={needsPassport}
          errors={errors}
          onChange={(next) => onChange(guests.map((current, i) => (i === g ? next : current)))}
          action={
            <SavedTravellerPicker
              travellers={saved}
              label={`room ${index + 1}, ${guestLabel(g, childAge)}`}
              taken={new Set(takenNames.filter((name, i) => name !== own || takenNames.indexOf(own) !== i))}
              onPick={(pick) => onChange(guests.map((current, i) => (i === g ? guestFromSaved(current, pick, child) : current)))}
            />
          }
        />
        );
      })}
    </Box>
  );
}
