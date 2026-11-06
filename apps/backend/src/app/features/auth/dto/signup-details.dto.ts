import type { SignupDetails } from "@quickhotels/types/users";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// The personal-information step of sign-up; the OTP is sent for these details.
export class SignupDetailsDto implements SignupDetails {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @Matches(/^[a-zA-Z0-9_.-]{3,20}$/, {
    message:
      "username must be 3-20 letters, numbers, dots, dashes or underscores",
  })
  username: string;
}
