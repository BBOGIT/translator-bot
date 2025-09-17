import { Logger } from '@nestjs/common';
import { CommandContext } from '../handlers/core/interfaces';
import { StateStrategy } from './state-strategy.interface';
import { withErrorHandling } from '../handlers/core/error-handler';
import { CustomerState } from '../../customer/enum/customer-state.enum';

/**
 * Базовий абстрактний клас для всіх стратегій обробки стану
 */
export abstract class BaseStateStrategy
  implements StateStrategy
{
  protected readonly logger: Logger;

  /**
   * @param stateName Назва стратегії/стану
   */
  constructor(public readonly name: string) {
    this.logger = new Logger(
      `StateStrategy:${name}`
    );
  }

  /**
   * Визначає, чи може дана стратегія обробити повідомлення
   * Базова імплементація перевіряє збіг стану користувача з назвою стратегії
   *
   * @param command Команда/текст повідомлення
   * @param context Контекст виконання
   */
  canHandle(
    command: string,
    context: CommandContext
  ): boolean {
    const customerState = context.customer?.state;
    return customerState === this.getStateEnum();
  }

  /**
   * Обробник повідомлення з безпечною обробкою помилок
   */
  async handleState(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { messageService } = services;

    if (!customer) {
      this.logger.error(
        `No customer found for state handling: ${dto.text}`
      );
      return;
    }

    return withErrorHandling(
      async () => {
        this.logger.log(
          `Processing message in state ${this.name}: ${dto.text}`
        );

        // Виклик конкретної реалізації стратегії
        await this.processState(context);

        this.logger.log(
          `State processing completed for chat ${dto.chatId}`
        );
      },
      `Failed to process message in state ${this.name}: ${dto.text}`,
      dto.chatId,
      lang,
      messageService,
      {
        customerId: customer.id,
        state: customer.state
      }
    );
  }

  /**
   * Метод, який повинні реалізувати конкретні стратегії
   */
  protected abstract processState(
    context: CommandContext
  ): Promise<void>;

  /**
   * Повертає перерахування стану, який відповідає даній стратегії
   */
  protected abstract getStateEnum(): CustomerState;
}
