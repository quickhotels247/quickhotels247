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
import type { FlightTraveller, FlightTravellerDetails, FlightTravellerTitle, FlightTravellerType } from "@quickhotels/types/flight-checkout";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value);
const upper = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toUpperCase() : value);
const digits = ({ value }: { value: unknown }) => (typeof value === "string" ? value.replace(/[\s-]/g, "") : value);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Shapes and formats; the trip-specific rules are in traveller-rules.ts.
export class PassportDto {
  @Transform(upper)
  @Matches(/^[A-Z0-9]{6,12}$/, { message: "Passport numbers have 6–12 letters and digits." })
  number!: string;

  // Two-letter country code, e.g. IN.
  @Transform(upper)
  @Matches(/^[A-Z]{2}$/, { message: "Choose the passport's country." })
  nationality!: string;

  @IsOptional()
  @Matches(DATE)
  expiry?: string;

  @IsOptional()
  @Matches(DATE)
  issueDate?: string;
}

export class FlightTravellerDto implements FlightTraveller {
  @IsIn(["adult", "child", "infant"])
  type!: FlightTravellerType;

  @IsIn(["Mr", "Mrs", "Ms", "Master"])
  title!: FlightTravellerTitle;

  @Transform(trim)
  @IsString()
  @MaxLength(60)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(60)
  lastName!: string;

  @IsOptional()
  @Matches(DATE, { message: "Dates of birth look like 2019-05-21." })
  dateOfBirth?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PassportDto)
  passport?: PassportDto;

  @IsOptional()
  @Transform(upper)
  @IsString()
  pan?: string;
}

export class FlightContactDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Enter a valid email address." })
  @MaxLength(254)
  email!: string;

  @Matches(/^\+\d{1,4}$/, { message: "Country code must look like +91." })
  phoneCode!: string;

  @Transform(digits)
  @Matches(/^\d{6,14}$/, { message: "Enter a valid mobile number." })
  phone!: string;
}

export class GstDto {
  @Transform(upper)
  @IsString()
  number!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(35, { message: "The GST company name can be up to 35 characters." })
  companyName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Transform(digits)
  @Matches(/^\d{6,14}$/)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(70, { message: "The GST address can be up to 70 characters." })
  address?: string;
}

export class EmergencyContactDto {
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  @Matches(/^[A-Za-z][A-Za-z .'-]+$/, { message: "Enter the emergency contact's name." })
  name!: string;

  @Matches(/^\+\d{1,4}$/)
  phoneCode!: string;

  @Transform(digits)
  @Matches(/^\d{6,14}$/, { message: "Enter the emergency contact's mobile number." })
  phone!: string;
}

// Body of PUT /api/v1/flights/reviews/:id/travellers.
export class FlightTravellerDetailsDto implements FlightTravellerDetails {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(13)
  @ValidateNested({ each: true })
  @Type(() => FlightTravellerDto)
  travellers!: FlightTravellerDto[];

  @ValidateNested()
  @Type(() => FlightContactDto)
  contact!: FlightContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GstDto)
  gst?: GstDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @Equals(true, { message: "Please accept the terms and the fare rules." })
  acceptTerms!: boolean;

  @IsOptional()
  @IsBoolean()
  acceptPriceChange?: boolean;
}
