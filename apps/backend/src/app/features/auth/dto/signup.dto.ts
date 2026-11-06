import type { SignupRequest } from "@quickhotels/types/users";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { SignupDetailsDto } from "./signup-details.dto.js";

export class SignupDto extends SignupDetailsDto implements SignupRequest {
  // Strength rules live in password-policy.ts so the service can apply them too.
  @IsString()
  @MaxLength(128)
  password: string;

  // Returned by POST /auth/signup/otp/verify once the email is confirmed.
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  verificationToken: string;
}
