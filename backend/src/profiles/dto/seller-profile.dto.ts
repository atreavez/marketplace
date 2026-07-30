import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateSellerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720) // 30 days — beyond that "response time" stops being meaningful
  responseTimeHours?: number;
}
