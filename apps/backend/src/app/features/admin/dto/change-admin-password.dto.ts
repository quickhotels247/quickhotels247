import type { ChangeAdminPasswordRequest } from "@quickhotels/types/admin";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ChangeAdminPasswordDto implements ChangeAdminPasswordRequest {
  @IsString()
  @IsNotEmpty({ message: "Enter your current password." })
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MaxLength(128)
  newPassword: string;
}
