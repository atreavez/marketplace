import { IsString, Length } from 'class-validator';

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 12) // 6-digit TOTP or a longer backup code
  code: string;
}

export class TwoFactorLoginVerifyDto {
  @IsString()
  twoFactorToken: string;

  @IsString()
  @Length(6, 12)
  code: string;
}
