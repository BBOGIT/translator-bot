import { ServiceError } from '../errors/domain-errors';
import { Logger } from '@nestjs/common';

const logger = new Logger('ErrorWrapper');

/**
 * Wraps an async function in a try-catch block
 * and converts any errors to the specified or default error type
 */
export async function wrapAsync<T>(
  operation: () => Promise<T>,
  options: {
    errorMessage?: string;
    errorType?: new (
      message: string,
      options: any
    ) => Error;
    context?: Record<string, unknown>;
    rethrow?: boolean;
    logError?: boolean;
  } = {}
): Promise<T> {
  const {
    errorMessage = 'Operation failed',
    errorType = ServiceError,
    context = {},
    rethrow = true,
    logError = true
  } = options;

  try {
    return await operation();
  } catch (error) {
    // Skip wrapping if it's already the desired error type
    if (error instanceof errorType) {
      if (logError) {
        logger.error(
          `${errorMessage}: ${error.message}`,
          error
        );
      }
      if (rethrow) {
        throw error;
      }
      return null as unknown as T;
    }

    // Log the error
    if (logError) {
      logger.error(
        `${errorMessage}: ${
          (error as Error).message ||
          'Unknown error'
        }`,
        {
          error,
          context
        }
      );
    }

    // Create and throw the custom error
    const customError = new errorType(
      errorMessage,
      {
        cause: error as Error,
        context
      }
    );

    if (rethrow) {
      throw customError;
    }

    return null as unknown as T;
  }
}

/**
 * Wraps a synchronous function in a try-catch block
 * and converts any errors to the specified or default error type
 */
export function wrapSync<T>(
  operation: () => T,
  options: {
    errorMessage?: string;
    errorType?: new (
      message: string,
      options: any
    ) => Error;
    context?: Record<string, unknown>;
    rethrow?: boolean;
    logError?: boolean;
  } = {}
): T {
  const {
    errorMessage = 'Operation failed',
    errorType = ServiceError,
    context = {},
    rethrow = true,
    logError = true
  } = options;

  try {
    return operation();
  } catch (error) {
    // Skip wrapping if it's already the desired error type
    if (error instanceof errorType) {
      if (logError) {
        logger.error(
          `${errorMessage}: ${error.message}`,
          error
        );
      }
      if (rethrow) {
        throw error;
      }
      return null as unknown as T;
    }

    // Log the error
    if (logError) {
      logger.error(
        `${errorMessage}: ${
          (error as Error).message ||
          'Unknown error'
        }`,
        {
          error,
          context
        }
      );
    }

    // Create and throw the custom error
    const customError = new errorType(
      errorMessage,
      {
        cause: error as Error,
        context
      }
    );

    if (rethrow) {
      throw customError;
    }

    return null as unknown as T;
  }
}
