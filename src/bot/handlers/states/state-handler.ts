import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { StateStrategyFactory } from '../../strategies/state-strategy.factory';
import { sendErrorMessage } from '../core/error-handler';
import { COMMANDS } from '../core/constants';

@Injectable()
export class StateHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    StateHandler.name
  );

  constructor(
    private readonly strategyFactory: StateStrategyFactory
  ) {}

  /**
   * Перевіряє, чи може цей обробник обробити дану команду
   * У випадку зі станами перевіряємо, чи є стратегія для поточного стану
   *
   * @param command Команда або текст повідомлення
   * @param customerState Поточний стан користувача
   * @returns boolean
   */
  canHandle(
    command: string,
    customerState?: string
  ): boolean {
    if (!customerState) {
      return false;
    }

    //to do: remove this
    if (
      command === COMMANDS.START ||
      command === COMMANDS.MAIN_MENU
    ) {
      return false;
    }
    if (command === COMMANDS.MY_PROGRESS) {
      return false;
    }

    return true;
  }

  /**
   * Виконує обробку команди в залежності від стану
   *
   * @param context Контекст команди
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { messageService } = services;

    try {
      if (!customer) {
        this.logger.error(
          `No customer found for state handling: ${dto.text}`
        );
        return;
      }

      // Пропускаємо команди головного меню, які обробляються MainMenuCommandHandler
      if (
        dto.text === COMMANDS.START ||
        dto.text === COMMANDS.MAIN_MENU
      ) {
        return; // Дозволяємо MainMenuCommandHandler обробити цю команду
      }

      // Пропускаємо специфічні команди, які обробляються іншими обробниками
      if (dto.text === COMMANDS.MY_PROGRESS) {
        return; // Дозволяємо іншим обробникам спробувати обробити цю команду
      }

      this.logger.log(
        `Processing state handler for state: ${customer.state}, command: ${dto.text}`
      );

      // Отримуємо стратегію для поточного стану
      const strategy =
        this.strategyFactory.getStrategy(
          customer.state
        );

      // Якщо стратегія знайдена і може обробити дану команду
      if (
        strategy &&
        strategy.canHandle(dto.text, context)
      ) {
        // Викликаємо обробку стану за допомогою стратегії
        await strategy.handleState(context);
      } else {
        // Якщо стратегія не знайдена або не може обробити команду
        this.logger.warn(
          `No strategy for state ${customer.state} or strategy can't handle command: ${dto.text}`
        );

        // Відправляємо повідомлення про невідому команду
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'notFoundCommand',
          lang
        });
      }
    } catch (error) {
      this.logger.error(
        `Error in state handler: ${error.message}`,
        error.stack
      );

      // Відправляємо повідомлення про помилку
      await sendErrorMessage(
        dto.chatId,
        lang,
        messageService
      );
    }
  }
}
