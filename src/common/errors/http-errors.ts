import { AppError } from './app-error';

/**
 * Base error class for all HTTP-related errors
 */
export class HttpError extends AppError {
  constructor(
    message: string,
    statusCode: number,
    options: {
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      statusCode,
      ...options
    });
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends HttpError {
  constructor(
    message = 'Bad Request',
    options: {
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, 400, {
      reportable: false,
      ...options
    });
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends HttpError {
  constructor(
    message = 'Unauthorized',
    options: {
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, 401, {
      reportable: false,
      ...options
    });
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends HttpError {
  constructor(
    message = 'Forbidden',
    options: {
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, 403, {
      reportable: false,
      ...options
    });
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends HttpError {
  constructor(
    message = 'Not Found',
    options: {
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, 404, {
      reportable: false,
      ...options
    });
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends HttpError {
  constructor(
    message = 'Conflict',
    options: {
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, 409, {
      reportable: false,
      ...options
    });
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends HttpError {
  constructor(
    message = 'Internal Server Error',
    options: {
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, 500, {
      reportable: true,
      ...options
    });
  }
}
