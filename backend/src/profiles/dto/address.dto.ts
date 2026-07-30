import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @IsString()
  @MaxLength(200)
  line1: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @Length(2, 2, { message: 'country must be an ISO 3166-1 alpha-2 code, e.g. "US", "UG"' })
  country: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// Every field optional — a PATCH updates only what's provided.
export class UpdateAddressDto {
  @IsOptional() @IsString() @MaxLength(40) label?: string;
  @IsOptional() @IsString() @MaxLength(120) recipientName?: string;
  @IsOptional() @IsString() @MaxLength(200) line1?: string;
  @IsOptional() @IsString() @MaxLength(200) line2?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) region?: string;
  @IsOptional() @IsString() @MaxLength(20) postalCode?: string;
  @IsOptional() @IsString() @Length(2, 2) country?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
