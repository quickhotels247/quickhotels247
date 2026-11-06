import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { AdminAuthService } from "./admin-auth.service.js";
import { AdminGuard, CurrentAdminId, CurrentAdminToken } from "./admin.guard.js";
import { AdminLoginDto } from "./dto/admin-login.dto.js";
import { ChangeAdminPasswordDto } from "./dto/change-admin-password.dto.js";
import { AdminSetupDto } from "./dto/new-admin.dto.js";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Throttle(LIMITS.login)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminLoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  // Whether the first-admin signup page is open.
  @Get("setup")
  setupStatus() {
    return this.auth.setupStatus();
  }

  // Creates the first admin and signs them in. Refused once any admin exists.
  @Throttle(LIMITS.setup)
  @Post("setup")
  setup(@Body() dto: AdminSetupDto, @Ip() ip: string) {
    return this.auth.setup(dto, ip);
  }

  @Throttle(LIMITS.sensitive)
  @Put("password")
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentAdminId() adminId: string,
    @CurrentAdminToken() token: string,
    @Body() dto: ChangeAdminPasswordDto,
  ) {
    await this.auth.changePassword(adminId, token, dto);
  }

  @Get("me")
  @UseGuards(AdminGuard)
  me(@CurrentAdminId() adminId: string) {
    return this.auth.me(adminId);
  }

  @Post("logout")
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentAdminToken() token: string) {
    await this.auth.logout(token);
  }
}
