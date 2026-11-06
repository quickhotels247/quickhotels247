import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import type { CheckoutGuest, CheckoutGuestDetails, GuestTitle } from "@quickhotels/types/checkout";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value);
const upper = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toUpperCase() : value);

// Latin letters, spaces, dots, apostrophes and hyphens, as suppliers accept.
const NAME = /^[A-Za-z][A-Za-z .'-]{1,39}$/;
export const GUEST_TITLES: GuestTitle[] = ["Mr", "Mrs", "Ms", "Miss", "Master"];

export class GuestDto implements CheckoutGuest {
  @IsIn(GUEST_TITLES)
  title!: GuestTitle;

  @Transform(trim)
  @Matches(NAME, { message: "First names need 2–40 letters (A–Z, spaces, . ' -)." })
  firstName!: string;

  @Transform(trim)
  @Matches(NAME, { message: "Last names need 2–40 letters (A–Z, spaces, . ' -)." })
  lastName!: string;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: "PAN must look like ABCDE1234F." })
  pan?: string;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z0-9]{6,12}$/, { message: "Passport numbers have 6–12 letters and digits." })
  passportNumber?: string;
}

export class RoomGuestsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => GuestDto)
  guests!: GuestDto[];
}

export class ContactDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Enter a valid email address." })
  @MaxLength(254)
  email!: string;

  @Matches(/^\+\d{1,4}$/, { message: "Country code must look like +91." })
  phoneCode!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.replace(/[\s-]/g, "") : value))
  @Matches(/^\d{6,14}$/, { message: "Enter a valid mobile number." })
  phone!: string;
}

// Body of PUT /api/v1/checkouts/:id/guests. Room count, guests per room and
// PAN/passport needs are checked against the checkout in the service.
export class GuestDetailsDto implements CheckoutGuestDetails {
  @ValidateNested()
  @Type(() => ContactDto)
  contact!: ContactDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => RoomGuestsDto)
  rooms!: RoomGuestsDto[];

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  specialRequests?: string;

  @Equals(true, { message: "Please accept the terms and the cancellation policy." })
  acceptTerms!: boolean;

  @IsOptional()
  @IsBoolean()
  acceptPriceChange?: boolean;
}
