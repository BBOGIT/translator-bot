import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import {
  tap,
  finalize,
  catchError
} from 'rxjs/operators';
import {
  trace,
  SpanKind,
  SpanStatusCode
} from '@opentelemetry/api';
import { Request, Response } from 'express';

/**
 * Interceptor to integrate with OpenTelemetry for distributed tracing.
 * Creates a span for each HTTP request and records relevant attributes.
 */
@Injectable()
export class TracingInterceptor
  implements NestInterceptor
{
  private readonly logger = new Logger(
    TracingInterceptor.name
  );
  private readonly serviceName = 'translator-bot';
  private readonly tracer = trace.getTracer(
    this.serviceName
  );

  /**
   * Intercepts the request to create and manage an OpenTelemetry span.
   * @param executionContext The execution context.
   * @param next The call handler.
   * @returns An observable of the response.
   */
  intercept(
    executionContext: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    const httpContext =
      executionContext.switchToHttp();
    const request =
      httpContext.getRequest<Request>();
    const response =
      httpContext.getResponse<Response>();

    const method = request.method;
    const url = request.url;
    const userAgent =
      request.get('user-agent') || 'unknown';
    const ip = request.ip;

    const startTime = Date.now();

    // Створюємо спан для запиту
    return this.tracer.startActiveSpan(
      `${method} ${url}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': method,
          'http.url': url,
          'http.user_agent': userAgent,
          'http.client_ip': ip,
          'http.request_id':
            request.headers['x-request-id'] || '',
          'service.name': this.serviceName
        }
      },
      span => {
        return next.handle().pipe(
          tap(data => {
            const statusCode =
              response.statusCode;
            let contentLength =
              response.getHeader(
                'Content-Length'
              );
            if (
              contentLength === undefined &&
              data !== undefined &&
              data !== null
            ) {
              try {
                contentLength = Buffer.byteLength(
                  JSON.stringify(data),
                  'utf8'
                );
              } catch {
                contentLength = 0;
              }
            } else if (
              contentLength === undefined
            ) {
              contentLength = 0;
            }

            span.setAttributes({
              'http.status_code': statusCode,
              'http.response_content_length':
                Number(contentLength)
            });

            if (
              statusCode >= 200 &&
              statusCode < 300
            ) {
              span.setStatus({
                code: SpanStatusCode.OK
              });
            } else {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: `Responded with HTTP status code ${statusCode}`
              });
            }
          }),
          catchError(err => {
            const errStatusCode =
              err.status || err.statusCode || 500;
            span.setAttributes({
              'http.status_code': errStatusCode,
              'error.message': err.message,
              'error.stack': err.stack,
              'error.type': err.name
            });
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: err.message
            });
            return throwError(() => err);
          }),
          finalize(() => {
            const duration =
              Date.now() - startTime;
            span.setAttributes({
              'http.duration_ms': duration
            });

            // Запис в лог
            this.logger.debug(
              `${method} ${url} - ${response.statusCode} - ${duration}ms`
            );

            // Завершення спану
            span.end();
          })
        );
      }
    );
  }
}
