import { IsBoolean, IsEnum, IsOptional, IsUrl } from 'class-validator';

export enum SocialPlatformDto {
  WEBSITE = 'WEBSITE',
  INSTAGRAM = 'INSTAGRAM',
  TWITTER = 'TWITTER',
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
  OTHER = 'OTHER',
}

export class CreateSocialLinkDto {
  @IsEnum(SocialPlatformDto)
  platform: SocialPlatformDto;

  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateSocialLinkDto {
  @IsOptional()
  @IsUrl({ require_protocol: true })
  url?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
