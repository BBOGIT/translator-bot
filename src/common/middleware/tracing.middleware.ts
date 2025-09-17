import {
  Injectable,
  NestMiddleware
} from '@nestjs/common';
import {
  NextFunction,
  Request,
  Response
} from 'express';
// import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api'; // Більше не потрібні для спанів тут
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to ensure each request has an x-request-id header,
 * and to propagate it to the response.
 */
@Injectable()
export class TracingMiddleware
  implements NestMiddleware
{
  // private readonly tracer = trace.getTracer('translator-bot'); // Більше не створюємо спани тут

  use(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestId =
      (req.headers['x-request-id'] as string) ||
      uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    // Логіку створення спану OpenTelemetry видалено, це робить TracingInterceptor

    next();
  }

  // Допоміжний метод getHttpFlavor більше не потрібен, якщо спани тут не створюються
  // private getHttpFlavor(req: Request): string {
  //   const reqAny = req as any;
  //   if (reqAny.httpVersionMajor === 2) {
  //     return 'http/2.0';
  //   } else if (reqAny.httpVersionMajor === 1) {
  //     if (reqAny.httpVersionMinor === 1) {
  //       return 'http/1.1';
  //     } else {
  //       return 'http/1.0';
  //     }
  //   }
  //   return 'http';
  // }
}
