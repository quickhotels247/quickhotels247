import { Body, Controller, Get, NotFoundException, Put, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../auth/auth.guard.js";
import { UsersRepository } from "../../auth/users.repository.js";
import { NotificationPreferencesDto } from "./dto/notification-preferences.dto.js";

// Email choices. Simple reads and writes of the user's row, so no service.
@Controller("account/preferences")
@UseGuards(AuthGuard)
export class PreferencesController {
  constructor(private readonly users: UsersRepository) {}

  @Get()
  async get(@CurrentUserId() userId: string) {
    const preferences = await this.users.preferences(userId);
    if (!preferences) throw new NotFoundException("Account not found.");
    return preferences;
  }

  @Put()
  set(@CurrentUserId() userId: string, @Body() dto: NotificationPreferencesDto) {
    return this.users.setPreferences(userId, { dealsEmails: dto.dealsEmails, tripReminders: dto.tripReminders, reviewRequests: dto.reviewRequests });
  }
}
