import type { TicketNoteRequest, TicketStatus, TicketUpdateRequest } from "@quickhotels/types/support";
import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];

export class TicketListQueryDto {
  @IsOptional()
  @IsIn(STATUSES)
  status?: TicketStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  page: number = 1;
}

export class TicketUpdateDto implements TicketUpdateRequest {
  @IsOptional()
  @IsIn(STATUSES)
  status?: TicketStatus;

  @IsOptional()
  @IsBoolean()
  assignToMe?: boolean | null;
}

export class TicketNoteDto implements TicketNoteRequest {
  @IsIn(["note", "reply"])
  kind: "note" | "reply";

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^[\s\S]{2,4000}$/, { message: "Write a note or reply (up to 4000 characters)." })
  body: string;
}
