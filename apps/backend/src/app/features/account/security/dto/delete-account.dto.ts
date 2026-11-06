import type { DeleteAccountRequest } from "@quickhotels/types/users";
import { IsString, MaxLength } from "class-validator";

export class DeleteAccountDto implements DeleteAccountRequest {
  @IsString()
  @MaxLength(254)
  confirmEmail: string;
}
