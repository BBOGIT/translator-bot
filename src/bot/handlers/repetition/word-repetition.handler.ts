import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { COMMANDS } from '../core/constants';
import {
  withErrorHandling,
  logError
} from '../core/error-handler';

/**
 * Обробник для функціоналу повторення слів
 */
@Injectable()
export class WordRepetitionHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    WordRepetitionHandler.name
  );

  /**
   * Перевіряє, чи може цей обробник опрацювати команду
   */
  canHandle(
    command: string,
    customerState?: string
  ): boolean {
    // Обробка спеціальних команд для повторення слів
    return (
      command.startsWith(COMMANDS.I_KNOW_WORD) ||
      command.startsWith(COMMANDS.LEARN_WORD)
    );
  }

  /**
   * Виконує логіку повторення слів
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { messageService } = services;

    if (!customer) {
      this.logger.error(
        `No customer found for word repetition: ${dto.text}`
      );
      return;
    }

    return withErrorHandling(
      async () => {
        this.logger.log(
          `Processing word repetition command: ${dto.text}`
        );

        // Обробка команд для повторення слів
        if (
          dto.text.startsWith(
            COMMANDS.I_KNOW_WORD
          )
        ) {
          await this.handleIKnowWord(context);
        } else if (
          dto.text.startsWith(COMMANDS.LEARN_WORD)
        ) {
          await this.handleLearnWord(context);
        }

        this.logger.log(
          `Word repetition process completed for chat ${dto.chatId}`
        );
      },
      `Failed to process word repetition command: ${dto.text}`,
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
   * Обробка команди "I Know Word"
   */
  private async handleIKnowWord(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { messageService, wordService } =
      services;

    // Отримання ID слова
    const wordId = this.extractWordId(dto.text);

    try {
      // Позначення слова як вивченого
      if (wordId && wordService) {
        // Тут мала б бути логіка оновлення слова, наприклад:
        // await wordService.updateWord(parseInt(wordId), { needToLearn: false });
      }

      // Відправка повідомлення
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'iknowWord',
        lang
      });
    } catch (error) {
      this.logger.error(
        `Error marking word as known: ${error.message}`
      );
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang
      });
    }
  }

  /**
   * Обробка команди "Learn Word"
   */
  private async handleLearnWord(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { messageService, wordService } =
      services;

    // Отримання ID слова
    const wordId = this.extractWordId(dto.text);

    try {
      // Позначення слова для вивчення
      if (wordId && wordService) {
        // Тут мала б бути логіка оновлення слова, наприклад:
        // await wordService.updateWord(parseInt(wordId), { needToLearn: true });
      }

      // Відправка повідомлення
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'translation',
        lang
      });
    } catch (error) {
      this.logger.error(
        `Error marking word for learning: ${error.message}`
      );
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang
      });
    }
  }

  /**
   * Отримання ID слова з команди
   */
  private extractWordId(command: string): string {
    const parts = command.split('_');
    return parts.length === 2 ? parts[1] : '';
  }
}
