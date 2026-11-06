import type { VerifySignupOtpRequest } from "@quickhotels/types/users";
import { Transform } from "class-transformer";
import { IsEmail, Matches, MaxLength } from "class-validator";

export class VerifyOtpDto implements VerifySignupOtpRequest {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Matches(/^\d{6}$/, { message: "code must be 6 digits" })
  code: string;
}
