import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { MailService } from "../../mail/mail.service.js";
import { testEmail } from "../../mail/templates/test.template.js";
import { AdminGuard, CurrentAdminId } from "./admin.guard.js";
import { TestEmailDto } from "./dto/test-email.dto.js";

// Email settings check for admins: is sending set up, and a test send.
@Controller("admin/mail")
@UseGuards(AdminGuard)
export class AdminMailController {
  constructor(private readonly mail: MailService) {}

  @Get("status")
  status() {
    return { configured: this.mail.configured };
  }

  @Throttle(LIMITS.sensitive)
  @Post("test")
  @HttpCode(HttpStatus.NO_CONTENT)
  async test(@Body() dto: TestEmailDto, @CurrentAdminId() _adminId: string) {
    await this.mail.send(testEmail(dto.to.trim()), { template: "admin-test" });
  }
}
