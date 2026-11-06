import { Body, Controller, Put, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../auth/auth.guard.js";
import { UpdateProfileDto } from "./dto/update-profile.dto.js";
import { ProfileService } from "./profile.service.js";

@Controller("account/profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Put()
  update(@CurrentUserId() userId: string, @Body() dto: UpdateProfileDto) {
    return this.profile.update(userId, dto);
  }
}
