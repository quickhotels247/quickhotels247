import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type {
  FlightTraveller,
  FlightTravellerRequirements,
} from "@quickhotels/types/flight-checkout";
import { countries } from "@/lib/countries";
import {
  fieldId,
  TITLES,
  TYPE_HINT,
  TYPE_LABEL,
  type FormErrors,
} from "../../../utils/travellerForm";
import { styles } from "./TravellerCard.styles";

interface TravellerCardProps {
  index: number;
  // "Adult 1", "Infant 1"…
  number: number;
  traveller: FlightTraveller;
  requirements: FlightTravellerRequirements;
  needsDob: boolean;
  errors: FormErrors;
  onChange: (traveller: FlightTraveller) => void;
  // "Fill from saved", for signed-in customers.
  action?: ReactNode;
}

// One traveller: title and names as on their ID, then only what this fare
// needs (date of birth, passport, PAN).
export default function TravellerCard({
  index,
  number,
  traveller,
  requirements: needs,
  needsDob,
  errors,
  onChange,
  action,
}: TravellerCardProps) {
  const set = (changes: Partial<FlightTraveller>) =>
    onChange({ ...traveller, ...changes });
  const setPassport = (
    changes: Partial<NonNullable<FlightTraveller["passport"]>>,
  ) =>
    set({
      passport: {
        number: "",
        nationality: "",
        ...traveller.passport,
        ...changes,
      },
    });
  const id = (field: string) => fieldId(index, field);
  const error = (field: string) => ({
    error: Boolean(errors[id(field)]),
    helperText: errors[id(field)],
  });
  const lead = index === 0;
  return (
    <Box component="fieldset" sx={styles.root}>
      <Typography component="legend" sx={styles.legend}>
        {TYPE_LABEL[traveller.type]} {number}
        <Box component="span" sx={styles.hint}>
          {" "}
          · {TYPE_HINT[traveller.type]}
        </Box>
      </Typography>
      {action && <Box sx={styles.action}>{action}</Box>}
      <Box sx={styles.grid}>
        <TextField
          select
          id={id("title")}
          label="Title"
          value={traveller.title}
          onChange={(event) =>
            set({ title: event.target.value as FlightTraveller["title"] })
          }
        >
          {TITLES[traveller.type].map((title) => (
            <MenuItem key={title} value={title}>
              {title}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id={id("first")}
          label="First and middle name"
          autoComplete={lead ? "given-name" : "off"}
          required
          value={traveller.firstName}
          onChange={(event) => set({ firstName: event.target.value })}
          slotProps={{
            htmlInput: { maxLength: needs.nameLimits?.first ?? 32 },
          }}
          {...error("first")}
        />
        <TextField
          id={id("last")}
          label="Last name"
          autoComplete={lead ? "family-name" : "off"}
          required
          value={traveller.lastName}
          onChange={(event) => set({ lastName: event.target.value })}
          slotProps={{ htmlInput: { maxLength: needs.nameLimits?.last ?? 32 } }}
          {...error("last")}
        />
      </Box>
      {(needsDob || needs.pan) && (
        <Box sx={[styles.grid, styles.extras]}>
          {needsDob && (
            <TextField
              id={id("dob")}
              label="Date of birth"
              type="date"
              required
              value={traveller.dateOfBirth ?? ""}
              onChange={(event) =>
                set({ dateOfBirth: event.target.value || undefined })
              }
              slotProps={{ inputLabel: { shrink: true } }}
              {...error("dob")}
            />
          )}
          {needs.pan && (
            <TextField
              id={id("pan")}
              label="PAN"
              required
              value={traveller.pan ?? ""}
              onChange={(event) =>
                set({ pan: event.target.value.toUpperCase() })
              }
              slotProps={{ htmlInput: { maxLength: 10 } }}
              {...error("pan")}
            />
          )}
        </Box>
      )}
      {needs.passport && (
        <Box sx={[styles.grid, styles.passport]}>
          <TextField
            id={id("passport")}
            label="Passport number"
            required
            value={traveller.passport?.number ?? ""}
            onChange={(event) =>
              setPassport({ number: event.target.value.toUpperCase() })
            }
            slotProps={{ htmlInput: { maxLength: 12 } }}
            {...error("passport")}
          />
          <TextField
            select
            id={id("nationality")}
            label="Passport country"
            required
            value={traveller.passport?.nationality ?? ""}
            onChange={(event) =>
              setPassport({ nationality: event.target.value })
            }
            slotProps={{
              select: {
                MenuProps: { slotProps: { paper: { sx: styles.menu } } },
              },
            }}
            {...error("nationality")}
          >
            {countries().map((country) => (
              <MenuItem key={country.code} value={country.code}>
                {country.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            id={id("expiry")}
            label={
              needs.passportExpiry ? "Expiry date" : "Expiry date (optional)"
            }
            type="date"
            required={needs.passportExpiry}
            value={traveller.passport?.expiry ?? ""}
            onChange={(event) =>
              setPassport({ expiry: event.target.value || undefined })
            }
            slotProps={{ inputLabel: { shrink: true } }}
            {...error("expiry")}
          />
        </Box>
      )}
    </Box>
  );
}
