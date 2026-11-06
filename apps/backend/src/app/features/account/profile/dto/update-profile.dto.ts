import type { Gender, PostalAddress, UpdateProfileRequest } from "@quickhotels/types/users";
import { Transform, Type } from "class-transformer";
import { IsIn, IsOptional, IsString, Matches, MaxLength, ValidateNested } from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value);
const trimOrNull = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") || null : value);
const NAME = /^[\p{L}][\p{L} .'-]{0,49}$/u;

export class PostalAddressDto implements PostalAddress {
  @Transform(trim)
  @IsString()
  @Matches(/^.{1,120}$/, { message: "Enter the address (up to 120 characters)." })
  line1: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(120)
  line2: string | null;

  @Transform(trim)
  @IsString()
  @Matches(/^.{1,60}$/, { message: "Enter the town or city." })
  city: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60)
  state: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(/^[A-Za-z0-9 -]{3,10}$/, { message: "Check the PIN or postcode." })
  postcode: string | null;

  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z]{2}$/, { message: "Choose the country." })
  country: string;
}

export class UpdateProfileDto implements UpdateProfileRequest {
  @Transform(trim)
  @IsString()
  @Matches(NAME, { message: "First name can have letters, spaces, dots, apostrophes and hyphens (up to 50)." })
  firstName: string;

  @Transform(trim)
  @IsString()
  @Matches(NAME, { message: "Last name can have letters, spaces, dots, apostrophes and hyphens (up to 50)." })
  lastName: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^(\+\d{1,4})?$/, { message: "Country code must look like +91." })
  phoneCode?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/[\s-]/g, "") : value))
  @IsString()
  @Matches(/^(\d{6,14})?$/, { message: "Phone numbers have 6–14 digits." })
  phone?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Dates of birth look like 1990-05-21." })
  dateOfBirth?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() || null : value))
  @Matches(/^[A-Z]{2}$/, { message: "Choose a nationality." })
  nationality?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsIn(["male", "female", "other"])
  gender?: Gender | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => PostalAddressDto)
  address?: PostalAddressDto | null;
}
