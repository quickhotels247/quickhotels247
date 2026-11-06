import type { SavedTravellerInput, SavedTravellerTitle } from "@quickhotels/types/travellers";
import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, Matches } from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") || null : value);
const NAME = /^[\p{L}][\p{L} .'-]{0,49}$/u;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class SavedTravellerDto implements SavedTravellerInput {
  @IsIn(["Mr", "Mrs", "Ms", "Master", "Miss"])
  title: SavedTravellerTitle;

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
  @Matches(DATE, { message: "Dates of birth look like 2019-05-21." })
  dateOfBirth?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() || null : value))
  @Matches(/^[A-Z]{2}$/, { message: "Choose a nationality." })
  nationality?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/\s/g, "").toUpperCase() || null : value))
  @Matches(/^[A-Z0-9]{6,12}$/, { message: "Passport numbers have 6–12 letters and digits." })
  passportNumber?: string | null;

  @IsOptional()
  @Transform(trim)
  @Matches(DATE, { message: "Passport expiry looks like 2030-05-21." })
  passportExpiry?: string | null;
}
