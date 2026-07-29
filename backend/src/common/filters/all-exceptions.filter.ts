import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PinoLogger } from 'nestjs-pino';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  requestId?: string;
  errors?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).id;

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const detail =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message
        : isHttpException
          ? exception.message
          : undefined;

    // Never leak stack traces or raw error messages for unexpected (5xx,
    // non-HttpException) errors — those are almost always internal detail
    // (a DB constraint name, a file path) that helps an attacker more than a user.
    const isServerError = status >= 500;
    const problem: ProblemDetails = {
      type: `https://httpstatuses.com/${status}`,
      title: isHttpException ? exception.name : 'Internal Server Error',
      status,
      detail: isServerError ? 'An unexpected error occurred.' : Array.isArray(detail) ? detail.join(', ') : detail,
      instance: request.url,
      requestId,
      ...(Array.isArray(detail) && !isServerError ? { errors: detail } : {}),
    };

    if (isServerError) {
      this.logger.error(
        { err: exception, requestId, path: request.url, method: request.method },
        'Unhandled exception',
      );
    } else {
      this.logger.warn(
        { requestId, path: request.url, method: request.method, status },
        detail ?? 'Request failed',
      );
    }

    response.status(status).contentType('application/problem+json').send(problem);
  }
}
