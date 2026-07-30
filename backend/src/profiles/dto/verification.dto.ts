import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum VerificationRequestTypeDto {
  IDENTITY = 'IDENTITY',
  SELLER = 'SELLER',
  BUSINESS = 'BUSINESS',
}

export class CreateVerificationRequestDto {
  @IsEnum(VerificationRequestTypeDto)
  type: VerificationRequestTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
