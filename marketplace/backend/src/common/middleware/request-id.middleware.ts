import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existing = req.headers['x-request-id'];
    const requestId = typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();

    // pino-http's genReqId also reads this header (see logger.config.ts), so
    // logs and this response header always agree on the same id.
    (req as any).id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
