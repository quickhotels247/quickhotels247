import type { ClerkExchangeRequest } from "@quickhotels/types/users";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ClerkExchangeDto implements ClerkExchangeRequest {
  // Clerk session token from the browser, right after Google sign-in.
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  token: string;
}
