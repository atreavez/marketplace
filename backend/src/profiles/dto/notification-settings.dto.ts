import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @IsOptional() @IsBoolean() dealUpdates?: boolean;
  @IsOptional() @IsBoolean() priceDrops?: boolean;
  @IsOptional() @IsBoolean() newMessages?: boolean;
  @IsOptional() @IsBoolean() marketing?: boolean;
}
