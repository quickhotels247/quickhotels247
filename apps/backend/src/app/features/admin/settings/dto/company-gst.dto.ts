import { Transform } from "class-transformer";
import { IsString, Length, Matches } from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

export class CompanyGstDto {
  // 15 characters, e.g. 29ABCDE1234F1Z5.
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @Matches(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, { message: "Enter a valid 15-character GSTIN, like 29ABCDE1234F1Z5." })
  gstNumber: string;

  @Transform(trim)
  @IsString()
  @Length(2, 100, { message: "Enter the registered name (2–100 characters)." })
  registeredName: string;
}
