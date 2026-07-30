import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum BusinessTypeDto {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  NONPROFIT = 'NONPROFIT',
  OTHER = 'OTHER',
}

export class UpdateBusinessProfileDto {
  @IsString()
  @MaxLength(160)
  legalName: string;

  @IsOptional()
  @IsEnum(BusinessTypeDto)
  businessType?: BusinessTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string;
}
