import { IsIn, IsOptional, IsString, Length } from 'class-validator';

// Kept intentionally small and explicit rather than validating against a
// full ISO-639-1/ISO-4217 list — the frontend is the source of truth for
// which languages/currencies it actually offers in its picker; the backend
// just needs to reject obvious garbage.
const SUPPORTED_THEMES = ['LIGHT', 'DARK', 'SYSTEM'] as const;

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @Length(2, 2, { message: 'language must be an ISO 639-1 code, e.g. "en", "fr"' })
  language?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'currency must be an ISO 4217 code, e.g. "USD", "KES"' })
  currency?: string;

  @IsOptional()
  @IsIn(SUPPORTED_THEMES)
  theme?: (typeof SUPPORTED_THEMES)[number];

  @IsOptional()
  @IsString()
  @Length(1, 64)
  timezone?: string; // IANA name, e.g. "Africa/Kampala" — not validated against the tz database here
}
