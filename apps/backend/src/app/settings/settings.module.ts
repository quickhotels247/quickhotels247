import { Global, Module } from "@nestjs/common";
import { CompanySettingsService } from "./company-settings.service.js";

// Business settings admins edit (stored in app_settings).
@Global()
@Module({
  providers: [CompanySettingsService],
  exports: [CompanySettingsService],
})
export class SettingsModule {}
