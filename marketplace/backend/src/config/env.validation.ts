import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
  MinLength,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// One class = the full contract for what this service needs to boot. If a
// required var is missing or malformed, the process exits with a readable
// error instead of the app starting in a half-configured state and failing
// confusingly on the first request that touches the missing piece.
class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @MinLength(1)
  DATABASE_URL: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters — generate with `openssl rand -base64 48`' })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  REDIS_URL: string = 'redis://localhost:6379';

  // Payment providers are optional at the env-validation level — a deployment
  // that hasn't configured Stripe/BTCPay yet should still boot; the Payments
  // module will fail clearly at the point of use instead, not at startup.
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BTCPAY_URL?: string;

  @IsString()
  @IsOptional()
  BTCPAY_API_KEY?: string;

  @IsString()
  @IsOptional()
  BTCPAY_STORE_ID?: string;

  @IsString()
  @IsOptional()
  BTCPAY_WEBHOOK_SECRET?: string;

  @IsEnum(['debug', 'info', 'warn', 'error'])
  @IsOptional()
  LOG_LEVEL: string = 'info';
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${messages}`);
  }
  return validated;
}
