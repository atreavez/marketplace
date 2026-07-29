import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_RULE = {
  minLength: 12,
  pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  message: 'Password must include upper, lower, and a number',
};

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(PASSWORD_RULE.minLength)
  @MaxLength(128)
  @Matches(PASSWORD_RULE.pattern, { message: PASSWORD_RULE.message })
  newPassword: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class ConfirmPasswordResetDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(PASSWORD_RULE.minLength)
  @MaxLength(128)
  @Matches(PASSWORD_RULE.pattern, { message: PASSWORD_RULE.message })
  newPassword: string;
}
