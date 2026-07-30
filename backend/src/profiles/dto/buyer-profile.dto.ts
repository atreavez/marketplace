import { IsArray, IsOptional, IsString, IsUUID, MaxLength, ArrayMaxSize } from 'class-validator';

export class UpdateBuyerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  favoriteCategories?: string[];

  @IsOptional()
  @IsUUID()
  defaultAddressId?: string;
}
