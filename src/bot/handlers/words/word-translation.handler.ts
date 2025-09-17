import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { COMMANDS } from '../core/constants';
import { CustomerState } from '../../../customer/enum/customer-state.enum';
import {
  withErrorHandling,
  logError
} from '../core/error-handler';
import { WordService } from '../../../word/word.service';

// Інтерфейс для даних збереження слова
interface WordSaveData {
  word: string;
  translation: string;
  customerId: number;
  // Додайте інші необхідні поля, якщо вони є
}

/**
 * Обробник для функціоналу перекладу та збереження слів
 */
@Injectable()
export class WordTranslationHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    WordTranslationHandler.name
  );

  /**
   * Перевіряє, чи може цей обробник опрацювати команду
   */
  canHandle(
    command: string,
    customerState?: string
  ): boolean {
    // Обробляємо введення в станах перекладу та збереження слів
    if (
      customerState ===
        CustomerState.WaitingForWord ||
      customerState ===
        CustomerState.WaitingForTranslation
    ) {
      return true;
    }
    return false;
  }

  /**
   * Виконує логіку перекладу та збереження слів
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const {
      customerService,
      messageService,
      wordService,
      aiService
    } = services;

    if (!customer) {
      this.logger.error(
        `No customer found for word translation: ${dto.text}`
      );
      return;
    }

    return withErrorHandling(
      async () => {
        this.logger.log(
          `Processing word translation: ${dto.text}, state: ${customer.state}`
        );

        // Обробка введення слова
        if (
          customer.state ===
          CustomerState.WaitingForWord
        ) {
          await this.handleWordInput(context);
        }
        // Обробка введення перекладу
        else if (
          customer.state ===
          CustomerState.WaitingForTranslation
        ) {
          await this.handleTranslationInput(
            context
          );
        }

        this.logger.log(
          `Word translation process completed for chat ${dto.chatId}`
        );
      },
      `Failed to process word translation: ${dto.text}`,
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
   * Обробка введення слова в стані WaitingForWord
   */
  private async handleWordInput(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const {
      customerService,
      messageService,
      aiService
    } = services;

    // Визначення мови та обробка слова
    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'waitingForTranslation',
      lang
    });

    // Оновлення стану
    await customerService.update({
      chatId: dto.chatId,
      state: CustomerState.WaitingForTranslation
    });
  }

  /**
   * Обробка введення перекладу в стані WaitingForTranslation
   */
  private async handleTranslationInput(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const {
      customerService,
      messageService,
      wordService
    } = services;

    try {
      // Обробка перекладу та збереження слова
      const wordData = {
        word: 'Sample Word', // Це мало б бути отримано з попереднього стану
        translation: dto.text,
        customerId: customer.id
      };

      // Збереження слова в базу даних
      await this.saveWordToDatabase(
        wordData,
        wordService
      );

      // Відправка повідомлення про підтвердження
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'savedWord',
        lang
      });

      // Повернення до головного меню
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
    } catch (error) {
      logError('Error saving word', error, {
        customerId: customer.id
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'savedWordError',
        lang
      });
    }
  }

  /**
   * Збереження даних слова в базу даних
   */
  private async saveWordToDatabase(
    wordData: WordSaveData,
    wordService: WordService
  ): Promise<void> {
    try {
      await wordService.createWord({
        ...wordData,
        needToLearn: true
      });
      this.logger.log(
        `Слово "${wordData.word}" збережено для користувача ${wordData.customerId}`
      );
    } catch (error) {
      logError(
        'Failed to save word in saveWordToDatabase',
        error,
        { wordData }
      );
      throw error;
    }
  }
}
