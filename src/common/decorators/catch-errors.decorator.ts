import { ServiceError } from '../errors/domain-errors';
import { Logger } from '@nestjs/common';

/**
 * Декоратор для обгортання методу класу в try-catch блок
 * та перетворення будь-яких помилок у вказаний або типовий тип помилки
 */
export function CatchErrors(
  options: {
    errorMessage?: string;
    errorType?: new (
      message: string,
      options: any
    ) => Error;
    context?:
      | Record<string, unknown>
      | ((
          target: any,
          methodName: string,
          args: any[]
        ) => Record<string, unknown>);
    rethrow?: boolean;
    logError?: boolean;
  } = {}
) {
  const {
    errorType = ServiceError,
    rethrow = true,
    logError = true
  } = options;

  return function (
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(
      `${target.constructor.name}:${methodName}`
    );

    descriptor.value = async function (
      ...args: any[]
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
              error
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

        // Логуємо помилку
        if (logError) {
          logger.error(
            `${errorMessage}: ${
              (error as Error).message ||
              'Unknown error'
            }`,
            {
              error,
              context,
              args: args.map(arg =>
                typeof arg === 'object'
                  ? arg
                    ? Object.keys(arg)
                    : null
                  : typeof arg
              )
            }
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
