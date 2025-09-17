import { AppError } from './app-error';

/**
 * Base error class for all domain-specific errors
 */
export class DomainError extends AppError {
  constructor(
    message: string,
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      statusCode: options.statusCode || 400,
      ...options
    });
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
  constructor(
    message = 'Validation failed',
    validationErrors?: Record<string, string[]>,
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      statusCode: options.statusCode || 400,
      errorCode:
        options.errorCode || 'VALIDATION_ERROR',
      reportable: false,
      context: { validationErrors },
      ...options
    });
  }

  /**
   * Get validation errors
   */
  get validationErrors(): Record<
    string,
    string[]
  > {
    return (
      (this.context.validationErrors as Record<
        string,
        string[]
      >) || {}
    );
  }
}

/**
 * Error thrown when an unauthorized action is attempted
 */
export class AccessDeniedError extends DomainError {
  constructor(
    message = 'Access denied',
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      statusCode: options.statusCode || 403,
      errorCode:
        options.errorCode || 'ACCESS_DENIED',
      ...options
    });
  }
}

/**
 * Error thrown when an entity is not found
 */
export class EntityNotFoundError extends DomainError {
  constructor(
    entityName: string,
    entityId?: string | number,
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
    } = {}
  ) {
    const message = entityId
      ? `${entityName} with ID ${entityId} not found`
      : `${entityName} not found`;

    super(message, {
      statusCode: options.statusCode || 404,
      errorCode:
        options.errorCode || 'ENTITY_NOT_FOUND',
      reportable: false,
      context: { entityName, entityId },
      ...options
    });
  }
}

/**
 * Error thrown when a service operation fails
 */
export class ServiceError extends DomainError {
  constructor(
    message = 'Service operation failed',
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      statusCode: options.statusCode || 500,
      errorCode:
        options.errorCode || 'SERVICE_ERROR',
      reportable: true,
      ...options
    });
  }
}

/**
 * Error related to external API calls
 */
export class ExternalApiError extends DomainError {
  constructor(
    serviceName: string,
    message = 'External API call failed',
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      statusCode: options.statusCode || 502,
      errorCode:
        options.errorCode || 'EXTERNAL_API_ERROR',
      reportable: true,
      context: {
        ...options.context,
        serviceName
      },
      ...options
    });
  }
}

/**
 * Specialized error for Telegram API errors
 */
export class TelegramApiError extends ExternalApiError {
  constructor(
    message = 'Telegram API call failed',
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super('Telegram', message, {
      errorCode:
        options.errorCode || 'TELEGRAM_API_ERROR',
      ...options
    });
  }
}

/**
 * Specialized error for AI provider errors
 */
export class AIProviderError extends ExternalApiError {
  constructor(
    providerName: string,
    message = 'AI provider API call failed',
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(providerName, message, {
      errorCode:
        options.errorCode || 'AI_PROVIDER_ERROR',
      ...options
    });
  }
}
