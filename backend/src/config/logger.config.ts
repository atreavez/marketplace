import { Params } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { IncomingMessage } from 'http';

// Centralized so both the HTTP request logger and any manually-injected
// Logger instances share the same redaction rules and level.
export function buildPinoOptions(config: ConfigService): Params {
  const isProd = config.get<string>('app.env') === 'production';

  return {
    pinoHttp: {
      level: config.get<string>('app.logLevel') ?? 'info',
      // Never let auth tokens, passwords, or webhook secrets reach log storage,
      // even by accident via a stray console.log of a request/response object.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.passwordHash',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
      genReqId: (req: IncomingMessage) =>
        (req.headers['x-request-id'] as string) || randomUUID(),
      customProps: (req) => ({
        // Surfaces the same id used for the X-Request-Id response header —
        // this is what lets a user-reported error be grep'd straight out of logs.
        requestId: (req as any).id,
      }),
      transport: isProd
        ? undefined // structured JSON straight to stdout in prod — let the log
        : { target: 'pino-pretty', options: { singleLine: true, colorize: true } }, // aggregator parse it
      autoLogging: {
        ignore: (req) => req.url === '/health' || req.url === '/health/live',
      },
    },
  };
}
