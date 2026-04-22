import { ServiceError } from '../errors/domain-errors';
import { Logger } from '@nestjs/common';

const logger = new Logger('ErrorWrapper');

/**
 * Wraps an async function in a try-catch block
 * and converts any errors to the specified or default error type
 */
/**
 * Тип для конструктора помилки
 */
type ErrorConstructor<T extends Error = Error> = new (
  message: string,
  options?: {
    cause?: Error;
    context?: Record<string, unknown>;
  }
) => T;

/**
 * Опції для обгортання асинхронних операцій
 */
interface WrapAsyncOptions<T extends Error = Error> {
  errorMessage?: string;
  errorType?: ErrorConstructor<T>;
  context?: Record<string, unknown>;
  rethrow?: boolean;
  logError?: boolean;
}

export async function wrapAsync<T, E extends Error = Error>(
  operation: () => Promise<T>,
  options: WrapAsyncOptions<E> = {}
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
          error.stack
        );
      }
      if (rethrow) {
        throw error;
      }
      return null as unknown as T;
    }

    if (logError) {
      logger.error(
        `${errorMessage}: ${
          (error as Error).message ||
          'Unknown error'
        }`,
        (error as Error).stack
      );
    }

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

export function wrapSync<T, E extends Error = Error>(
  operation: () => T,
  options: WrapAsyncOptions<E> = {}
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
    if (error instanceof errorType) {
      if (logError) {
        logger.error(
          `${errorMessage}: ${error.message}`,
          error.stack
        );
      }
      if (rethrow) {
        throw error;
      }
      return null as unknown as T;
    }

    if (logError) {
      logger.error(
        `${errorMessage}: ${
          (error as Error).message ||
          'Unknown error'
        }`,
        (error as Error).stack
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
