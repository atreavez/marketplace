import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;

  // Changing email resets emailVerifiedAt and issues a fresh verification
  // token — handled in UsersService.updateProfile, not here.
  @IsOptional()
  @IsEmail()
  email?: string;
}
