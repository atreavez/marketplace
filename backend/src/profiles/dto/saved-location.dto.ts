import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSavedLocationDto {
  @IsString()
  @MaxLength(60)
  label: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}

export class UpdateSavedLocationDto {
  @IsOptional() @IsString() @MaxLength(60) label?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
}
