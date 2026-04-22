import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ServiceError } from '../errors/domain-errors';

/**
 * Interceptor to handle errors thrown in async operations
 * and convert them to application-specific errors
 */
@Injectable()
export class ErrorHandlingInterceptor
  implements NestInterceptor
{
  private readonly logger = new Logger(
    ErrorHandlingInterceptor.name
  );

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError(error => {
        // Skip if it's already an AppError
        if (
          error.name &&
          error.name.endsWith('Error') &&
          'statusCode' in error
        ) {
          return throwError(() => error);
        }

        // Log the original error
        this.logger.error(
          `Error caught by interceptor: ${error.message}`,
          error.stack
        );

        // Convert to ServiceError
        const serviceError = new ServiceError(
          'An unexpected error occurred during operation',
          {
            cause: error,
            context: {
              path: context.getArgs()[0]?.url,
              method: context.getArgs()[0]?.method
            }
          }
        );

        return throwError(() => serviceError);
      })
    );
  }
}
