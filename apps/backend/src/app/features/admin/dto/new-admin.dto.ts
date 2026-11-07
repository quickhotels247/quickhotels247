import type { AddAdminRequest, AdminRole, AdminSetupRequest, NewAdminRequest, UpdateAdminRequest } from "@quickhotels/types/admin";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// The first admin (signup page) or one added by another admin.
export class NewAdminDto implements NewAdminRequest {
  @Transform(trim)
  @IsString()
  @Length(1, 80, { message: "Enter a name." })
  name: string;

  @Transform(trim)
  @IsEmail({}, { message: "Enter a valid email." })
  @MaxLength(254)
  email: string;

  // Strength is checked by checkAdminPassword, for a clearer message.
  @IsString()
  @MaxLength(128)
  password: string;
}

// The first admin, from the sign-up page.
export class AdminSetupDto extends NewAdminDto implements AdminSetupRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  setupToken?: string;
}

const ROLES: AdminRole[] = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_AGENT"];

// A teammate added by a super admin, with their role.
export class AddAdminDto extends NewAdminDto implements AddAdminRequest {
  @IsIn(ROLES, { message: "Choose a role." })
  role: AdminRole;
}

export class UpdateAdminDto implements UpdateAdminRequest {
  @IsIn(ROLES, { message: "Choose a role." })
  role: AdminRole;
}
