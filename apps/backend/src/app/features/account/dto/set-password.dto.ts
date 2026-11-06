import type { SetPasswordRequest } from "@quickhotels/types/users";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class SetPasswordDto implements SetPasswordRequest {
  // Strength rules live in password-policy.ts.
  @IsString()
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}
