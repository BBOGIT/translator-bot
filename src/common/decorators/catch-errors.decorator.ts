import { ServiceError } from '../errors/domain-errors';
import { Logger } from '@nestjs/common';

/**
 * Декоратор для обгортання методу класу в try-catch блок
 * та перетворення будь-яких помилок у вказаний або типовий тип помилки
 */
/**
 * Типи для конструктора кастомної помилки
 */
type ErrorConstructor<T extends Error = Error> = new (
  message: string,
  options?: {
    cause?: Error;
    context?: Record<string, unknown>;
  }
) => T;

/**
 * Тип для функції контексту
 */
type ContextFunction = (
  target: unknown,
  methodName: string,
  args: unknown[]
) => Record<string, unknown>;

/**
 * Опції для декоратора CatchErrors
 */
interface CatchErrorsOptions<T extends Error = Error> {
  errorMessage?: string;
  errorType?: ErrorConstructor<T>;
  context?: Record<string, unknown> | ContextFunction;
  rethrow?: boolean;
  logError?: boolean;
}

export function CatchErrors<T extends Error = Error>(
  options: CatchErrorsOptions<T> = {}
) {
  const {
    errorType = ServiceError as any,
    rethrow = true,
    logError = true
  } = options;

  return function (
    target: unknown,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(
      `${(target as any).constructor.name}:${methodName}`
    );

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ) {
      try {
        return await originalMethod.apply(
          this,
          args
        );
      } catch (error) {
        // Пропускаємо обгортання, якщо це вже потрібний тип помилки
        if (error instanceof errorType) {
          if (logError) {
            logger.error(
              `Method execution failed: ${error.message}`,
              error.stack
            );
          }
          if (rethrow) {
            throw error;
          }
          return null;
        }

        // Створюємо повідомлення про помилку
        const errorMessage =
          options.errorMessage ||
          `Error in ${target.constructor.name}.${methodName}()`;

        // Створюємо контекст помилки
        let context: Record<string, unknown> = {};
        if (
          typeof options.context === 'function'
        ) {
          context = options.context(
            this,
            methodName,
            args
          );
        } else if (options.context) {
          context = options.context;
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

        // Створюємо і кидаємо власну помилку
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

        return null;
      }
    };

    return descriptor;
  };
}
