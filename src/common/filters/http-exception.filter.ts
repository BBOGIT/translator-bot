import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { MetricsService } from '../metrics/metrics.service';
import { ValidationError } from '../errors/domain-errors';

/**
 * Filter to handle all exceptions thrown in the application,
 * log them, collect metrics, and send a standardized response.
 */
@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger(
    HttpExceptionFilter.name
  );

  constructor(
    private readonly metricsService: MetricsService
  ) {}

  catch(
    exception: unknown,
    host: ArgumentsHost
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode =
      HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details = null;

    // Handle different types of errors
    if (exception instanceof AppError) {
      // Our custom AppError
      statusCode = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;

      // Log error if reportable
      if (exception.reportable) {
        this.logger.error(
          `[${errorCode}] ${message}`,
          exception.getDetails()
        );
      }

      // Add validation errors to response if present
      if (exception instanceof ValidationError) {
        details = exception.validationErrors;
      }
    } else if (
      exception instanceof HttpException
    ) {
      // NestJS HttpException
      statusCode = exception.getStatus();
      const exceptionResponse =
        exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message =
          (exceptionResponse as any).message ||
          message;
        errorCode =
          (exceptionResponse as any).error ||
          `HTTP_${statusCode}`;
        details =
          (exceptionResponse as any).details ||
          null;
      } else {
        message = exceptionResponse as string;
        errorCode = `HTTP_${statusCode}`;
      }

      this.logger.error(
        `[${errorCode}] ${message}`,
        exception.stack
      );
    } else {
      // Unknown error
      const error = exception as Error;
      message = error.message || message;
      // errorCode залишається 'INTERNAL_SERVER_ERROR' як визначено вище

      this.logger.error(
        `Unhandled exception: ${message}`,
        error.stack
      );
    }

    // --- Metrics Collection ---
    const finalErrorCodeForMetrics = errorCode; // Використовуємо errorCode, який вже визначено
    const method = request.method;
    const path = request.url;

    this.metricsService.incrementErrors(
      'http',
      finalErrorCodeForMetrics
    );
    this.metricsService.incrementHttpRequest(
      method,
      path,
      statusCode
    );
    // --- End Metrics Collection ---

    // Return error response
    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: {
        code: errorCode,
        message,
        details
      }
    });
  }
}
