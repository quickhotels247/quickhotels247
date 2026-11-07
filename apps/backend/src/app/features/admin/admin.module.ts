import { AdminSupportController } from "./support/admin-support.controller.js";
import { AdminSupportRepository } from "./support/admin-support.repository.js";
import { AdminSupportService } from "./support/admin-support.service.js";
import { AdminPricingController } from "./pricing/admin-pricing.controller.js";
import { AdminPricingService } from "./pricing/admin-pricing.service.js";
import { AdminMailController } from "./admin-mail.controller.js";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { adminConfig } from "./admin.config.js";
import { AdminGuard } from "./admin.guard.js";
import { AdminAdminsController } from "./admin-admins.controller.js";
import { AdminAdminsService } from "./admin-admins.service.js";
import { AdminAuthController } from "./admin-auth.controller.js";
import { AdminAuthService } from "./admin-auth.service.js";
import { AdminOverviewController } from "./admin-overview.controller.js";
import { AdminUsersController } from "./admin-users.controller.js";
import { AdminUsersRepository } from "./admin-users.repository.js";
import { AdminUsersService } from "./admin-users.service.js";
import { AdminsRepository } from "./admins.repository.js";
import { AuditLogRepository } from "./audit-log.repository.js";

// The admin dashboard, under /api/admin. Admins sign in separately from users.
@Module({
  imports: [ConfigModule.forFeature(adminConfig)],
  controllers: [
    AdminSupportController,
    AdminPricingController,
    AdminMailController,
    AdminAuthController,
    AdminAdminsController,
    AdminOverviewController,
    AdminUsersController,
  ],
  providers: [
    AdminSupportService,
    AdminSupportRepository,
    AdminPricingService,
    AdminsRepository,
    AdminGuard,
    AdminAuthService,
    AdminAdminsService,
    AuditLogRepository,
    AdminUsersRepository,
    AdminUsersService,
  ],
})
export class AdminModule {}
