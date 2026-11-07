import { IsEmail, MaxLength } from "class-validator";

export class TestEmailDto {
  @IsEmail({}, { message: "Enter a valid email address." })
  @MaxLength(254)
  to: string;
}
