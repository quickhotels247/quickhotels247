import { SUPPORT_TOPICS, type CreateTicketRequest, type SupportTopic } from "@quickhotels/types/support";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const trimOrNull = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() || null : value);

export class CreateTicketDto implements CreateTicketRequest {
  @Transform(trim)
  @IsString()
  @Matches(/^.{2,80}$/, { message: "Enter your name." })
  name: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Enter a valid email address so we can reply." })
  @MaxLength(254)
  email: string;

  @IsOptional()
  @Transform(trimOrNull)
  @Matches(/^\+?[\d\s-]{6,20}$/, { message: "Check the phone number." })
  phone?: string | null;

  @IsIn([...SUPPORT_TOPICS], { message: "Choose what your message is about." })
  topic: SupportTopic;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() || null : value))
  @Matches(/^[A-Z0-9-]{4,30}$/, { message: "Booking references have letters and numbers, e.g. QH-7K2M9P." })
  bookingReference?: string | null;

  @Transform(trim)
  @IsString()
  @Matches(/^[\s\S]{10,4000}$/, { message: "Tell us a bit more (at least 10 characters)." })
  message: string;
}
