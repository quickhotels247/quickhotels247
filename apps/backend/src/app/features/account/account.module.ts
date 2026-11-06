import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AccountController } from "./account.controller.js";
import { AccountService } from "./account.service.js";
import { AccountDeletionRepository } from "./security/account-deletion.repository.js";
import { SecurityController } from "./security/security.controller.js";
import { SecurityService } from "./security/security.service.js";
import { SavedHotelsController } from "./saved-hotels/saved-hotels.controller.js";
import { SavedHotelsRepository } from "./saved-hotels/saved-hotels.repository.js";
import { SavedHotelsService } from "./saved-hotels/saved-hotels.service.js";
import { PreferencesController } from "./preferences/preferences.controller.js";
import { ProfileController } from "./profile/profile.controller.js";
import { ProfileService } from "./profile/profile.service.js";
import { TravellersController } from "./travellers/travellers.controller.js";
import { TravellersRepository } from "./travellers/travellers.repository.js";
import { TravellersService } from "./travellers/travellers.service.js";

// The signed-in customer's account: sign-in methods, profile, saved travellers,
// saved hotels, signed-in devices and account deletion.
@Module({
  imports: [AuthModule],
  controllers: [AccountController, ProfileController, TravellersController, SecurityController, SavedHotelsController, PreferencesController],
  providers: [AccountService, ProfileService, TravellersService, TravellersRepository, SecurityService, AccountDeletionRepository, SavedHotelsService, SavedHotelsRepository],
})
export class AccountModule {}
