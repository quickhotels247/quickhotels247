import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import type { CabinClass, FlightLeg, FlightSearchCriteria, TripType } from "@quickhotels/types/flights";

const IATA = /^[A-Z]{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const upper = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toUpperCase() : value);

export class FlightLegDto implements FlightLeg {
  @Transform(upper)
  @Matches(IATA, { message: "Each flight needs a 3-letter airport code to leave from." })
  from!: string;

  @Transform(upper)
  @Matches(IATA, { message: "Each flight needs a 3-letter airport code to fly to." })
  to!: string;

  @Matches(ISO_DATE, { message: "Each flight needs a date like 2026-12-20." })
  depart!: string;
}

// Body of POST /api/v1/flights/searches. Date order and the infants rule are
// checked in FlightsService.
export class SearchFlightsDto implements FlightSearchCriteria {
  @IsIn(["roundTrip", "oneWay", "multiCity"])
  tripType!: TripType;

  @ValidateIf((dto: SearchFlightsDto) => dto.tripType !== "multiCity")
  @Transform(upper)
  @Matches(IATA, { message: "from must be a 3-letter airport code" })
  from: string = "";

  @ValidateIf((dto: SearchFlightsDto) => dto.tripType !== "multiCity")
  @Transform(upper)
  @Matches(IATA, { message: "to must be a 3-letter airport code" })
  to: string = "";

  @ValidateIf((dto: SearchFlightsDto) => dto.tripType !== "multiCity")
  @Matches(ISO_DATE, { message: "depart must be a date like 2026-12-20" })
  depart: string = "";

  @ValidateIf((dto: SearchFlightsDto) => dto.tripType === "roundTrip")
  @Matches(ISO_DATE, { message: "return must be a date like 2026-12-23" })
  return: string = "";

  @ValidateIf((dto: SearchFlightsDto) => dto.tripType === "multiCity")
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => FlightLegDto)
  legs: FlightLegDto[] = [];

  @IsInt()
  @Min(1)
  @Max(9)
  adults!: number;

  @IsInt()
  @Min(0)
  @Max(8)
  children!: number;

  @IsInt()
  @Min(0)
  @Max(4)
  infants!: number;

  @IsIn(["economy", "premiumEconomy", "business", "first"])
  cabin!: CabinClass;

  @IsOptional()
  @IsBoolean()
  directOnly: boolean = false;
}
