import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BuyerProfileService } from './buyer-profile.service';
import { SellerProfileService } from './seller-profile.service';
import { BusinessProfileService } from './business-profile.service';
import { VerificationService } from './verification.service';
import { SocialLinksService } from './social-links.service';
import { AddressesService } from './addresses.service';
import { SavedLocationsService } from './saved-locations.service';
import { SettingsService } from './settings.service';
import { PublicProfileService } from './public-profile.service';
import { ProfilesController } from './profiles.controller';
import { SocialLinksController } from './social-links.controller';
import { AddressesController } from './addresses.controller';
import { SavedLocationsController } from './saved-locations.controller';
import { SettingsController } from './settings.controller';

@Module({
  // JwtAuthGuard itself would work even without this import (its passport
  // strategy is already registered once via AppModule's existing AuthModule
  // import) — but importing it here makes this module's dependency on
  // Module 2 explicit in the module graph, and gives Profiles services
  // access to AuthModule's exports (SessionsService, etc.) if a future
  // feature here needs them, without a second wiring change.
  imports: [AuthModule],
  controllers: [
    ProfilesController,
    SocialLinksController,
    AddressesController,
    SavedLocationsController,
    SettingsController,
  ],
  providers: [
    BuyerProfileService,
    SellerProfileService,
    BusinessProfileService,
    VerificationService,
    SocialLinksService,
    AddressesService,
    SavedLocationsService,
    SettingsService,
    PublicProfileService,
  ],
  exports: [SellerProfileService, VerificationService],
})
export class ProfilesModule {}
