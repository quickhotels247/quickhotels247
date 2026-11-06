import type { NotificationPreferences } from "@quickhotels/types/users";
import { IsBoolean } from "class-validator";

export class NotificationPreferencesDto implements NotificationPreferences {
  @IsBoolean()
  dealsEmails: boolean;

  @IsBoolean()
  tripReminders: boolean;

  @IsBoolean()
  reviewRequests: boolean;
}
