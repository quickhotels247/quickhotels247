import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../../common/throttle/limits.js";
import { AuthGuard, CurrentSessionToken, CurrentUserId } from "../../auth/auth.guard.js";
import { DeleteAccountDto } from "./dto/delete-account.dto.js";
import { SecurityService } from "./security.service.js";

@Controller("account")
@UseGuards(AuthGuard)
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Get("sessions")
  sessions(@CurrentUserId() userId: string, @CurrentSessionToken() token: string) {
    return this.security.sessionsFor(userId, token);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  signOut(@CurrentUserId() userId: string, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.security.signOut(userId, id);
  }

  @Post("sessions/sign-out-others")
  @HttpCode(HttpStatus.NO_CONTENT)
  signOutOthers(@CurrentUserId() userId: string, @CurrentSessionToken() token: string) {
    return this.security.signOutOthers(userId, token);
  }

  @Throttle(LIMITS.sensitive)
  @Post("delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAccount(@CurrentUserId() userId: string, @Body() dto: DeleteAccountDto) {
    return this.security.deleteAccount(userId, dto.confirmEmail);
  }
}
