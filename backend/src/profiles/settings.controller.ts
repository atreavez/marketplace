import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdatePreferencesDto } from './dto/preferences.dto';
import { UpdatePrivacySettingsDto } from './dto/privacy.dto';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';

@ApiTags('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('profiles/me')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get('preferences')
  getPreferences(@CurrentUser() user: { userId: string }) {
    return this.settings.getPreferences(user.userId);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: { userId: string }, @Body() dto: UpdatePreferencesDto) {
    return this.settings.updatePreferences(user.userId, dto);
  }

  @Get('privacy')
  getPrivacy(@CurrentUser() user: { userId: string }) {
    return this.settings.getPrivacySettings(user.userId);
  }

  @Patch('privacy')
  updatePrivacy(@CurrentUser() user: { userId: string }, @Body() dto: UpdatePrivacySettingsDto) {
    return this.settings.updatePrivacySettings(user.userId, dto);
  }

  @Get('notifications')
  getNotifications(@CurrentUser() user: { userId: string }) {
    return this.settings.getNotificationSettings(user.userId);
  }

  @Patch('notifications')
  updateNotifications(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.settings.updateNotificationSettings(user.userId, dto);
  }
}
