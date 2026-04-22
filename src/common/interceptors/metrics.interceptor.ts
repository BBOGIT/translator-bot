import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Interceptor to collect metrics for HTTP requests.
 *
 * Collects:
 * - In-progress request counts.
 * - Total request counts by method, path, and status code (for success).
 * - Request duration.
 */
@Injectable()
export class MetricsInterceptor
  implements NestInterceptor
{
  constructor(
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Intercepts the request to record metrics.
   * @param context The execution context.
   * @param next The call handler.
   * @returns An observable of the response.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const method = request.method;
    const path =
      request.route?.path || request.url;
    const startTime = Date.now();

    this.metricsService.incrementHttpRequestInProgress(
      method,
      path
    );

    return next.handle().pipe(
      tap({
        next: data => {
          this.handleSuccess(
            method,
            path,
            startTime,
            response
          );
          return data;
        },
        error: error => {
          this.handleError(
            method,
            path,
            error,
            startTime
          );
          throw error;
        }
      })
    );
  }

  /**
   * Handles successful responses for metrics collection.
   * @param method HTTP method.
   * @param path Request path.
   * @param startTime Start time of the request processing.
   * @param response The HTTP response object.
   */
  private handleSuccess(
    method: string,
    path: string,
    startTime: number,
    response: Response | unknown
  ): void {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = (response as any)?.statusCode || 200;

    this.metricsService.decrementHttpRequestInProgress(
      method,
      path
    );
    this.metricsService.incrementHttpRequest(
      method,
      path,
      statusCode
    );
    this.metricsService.trackApiCallDuration(
      method,
      path,
      duration
    );
  }

  /**
   * Handles error responses for metrics collection.
   * Specifically, decrements in-progress requests and tracks duration.
   * Error counting and detailed request metrics for errors are handled by HttpExceptionFilter.
   * @param method HTTP method.
   * @param path Request path.
   * @param error The error object (currently unused in this method after refactor).
   * @param startTime Start time of the request processing.
   */
  private handleError(
    method: string,
    path: string,
    error: unknown,
    startTime: number
  ): void {
    const endTime = Date.now();
    const duration = endTime - startTime;

    this.metricsService.decrementHttpRequestInProgress(
      method,
      path
    );
    this.metricsService.trackApiCallDuration(
      method,
      path,
      duration
    );
  }
}
