import { IsBoolean, IsIn, IsOptional } from 'class-validator';

const VISIBILITY = ['PUBLIC', 'PRIVATE'] as const;

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsIn(VISIBILITY)
  profileVisibility?: (typeof VISIBILITY)[number];

  @IsOptional()
  @IsBoolean()
  showEmailPublicly?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhonePublicly?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMessagesFromStrangers?: boolean;

  @IsOptional()
  @IsBoolean()
  searchEngineIndexing?: boolean;
}
