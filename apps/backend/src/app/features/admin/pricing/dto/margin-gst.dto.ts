import { IsNumber, Max, Min } from "class-validator";

export class MarginGstDto {
  // Percent; 0 turns it off.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(28)
  percent: number;
}
