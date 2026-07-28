import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  // Minimum 12 chars + complexity — short passwords are the #1 credential-stuffing vector.
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must include upper, lower, and a number',
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
