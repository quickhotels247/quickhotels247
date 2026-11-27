import { IsOptional, Matches } from "class-validator";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// India days, inclusive. Both optional: the last 30 days by default.
export class DashboardQueryDto {
  @IsOptional()
  @Matches(DAY, { message: "from must be a date like 2026-11-01." })
  from?: string;

  @IsOptional()
  @Matches(DAY, { message: "to must be a date like 2026-11-30." })
  to?: string;
}
