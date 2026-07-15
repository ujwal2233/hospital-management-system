import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const b = body as { message?: string | string[]; error?: string };
        if (Array.isArray(b.message)) {
          message = 'Validation failed';
          errors = b.message;
        } else {
          message = b.message ?? b.error ?? message;
        }
      }
    } else if (this.isMongoDuplicateKey(exception)) {
      status = HttpStatus.CONFLICT;
      message = 'A record with the same unique value already exists';
    } else if (exception instanceof Error) {
      if (process.env.NODE_ENV !== 'production') message = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private isMongoDuplicateKey(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      (exception as { code?: number }).code === 11000
    );
  }
}
