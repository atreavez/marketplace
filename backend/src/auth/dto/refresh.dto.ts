import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  refreshToken: string;
}

// Optional client-supplied label ("iPhone 15", "Work laptop") shown in the
// device management list — purely cosmetic, never trusted for security decisions.
export class DeviceLabelDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceLabel?: string;
}
