import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/preferences.dto';
import { UpdatePrivacySettingsDto } from './dto/privacy.dto';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // --- Preferences: language, currency, theme, timezone ---

  async getPreferences(userId: string) {
    return (
      (await this.prisma.userPreferences.findUnique({ where: { userId } })) ??
      this.prisma.userPreferences.create({ data: { userId } })
    );
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    await this.getPreferences(userId); // ensures a row exists
    return this.prisma.userPreferences.update({ where: { userId }, data: dto });
  }

  // --- Privacy ---

  async getPrivacySettings(userId: string) {
    return (
      (await this.prisma.privacySettings.findUnique({ where: { userId } })) ??
      this.prisma.privacySettings.create({ data: { userId } })
    );
  }

  async updatePrivacySettings(userId: string, dto: UpdatePrivacySettingsDto) {
    await this.getPrivacySettings(userId);
    return this.prisma.privacySettings.update({ where: { userId }, data: dto });
  }

  // --- Notifications ---

  async getNotificationSettings(userId: string) {
    return (
      (await this.prisma.notificationSettings.findUnique({ where: { userId } })) ??
      this.prisma.notificationSettings.create({ data: { userId } })
    );
  }

  async updateNotificationSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    await this.getNotificationSettings(userId);
    return this.prisma.notificationSettings.update({ where: { userId }, data: dto });
  }
}
