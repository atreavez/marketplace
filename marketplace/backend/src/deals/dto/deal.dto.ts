import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateInquiryDto {
  @IsUUID()
  listingId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

const ALLOWED_STAGES = ['NEGOTIATION', 'ACCEPTED', 'CANCELLED'] as const;

export class TransitionDealDto {
  @IsIn(ALLOWED_STAGES)
  toStage: (typeof ALLOWED_STAGES)[number];
}
