import { IsString, IsOptional, IsNumber, Min, MaxLength, IsObject, IsUUID } from 'class-validator';

export class CreateListingDto {
  @IsString()
  @MaxLength(140)
  title: string;

  @IsString()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // Seller-defined attributes for when the category template doesn't fit —
  // this is the "categories aren't hardcoded" mechanism in practice.
  @IsOptional()
  @IsObject()
  customAttrs?: Record<string, unknown>;
}

export class SearchListingsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
