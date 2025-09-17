import { Injectable } from '@nestjs/common';
import { CommandContext } from '../handlers/core/interfaces';
import { BaseStateStrategy } from './base-state.strategy';
import { CustomerState } from '../../customer/enum/customer-state.enum';
import { logError } from '../handlers/core/error-handler';
import { WordService } from '../../word/word.service';

/**
 * Інтерфейс для даних збереження слова
 */
interface WordSaveData {
  word: string;
  translation: string;
  customerId: number;
}

/**
 * Стратегія для обробки стану WaitingForTranslation
 *
 * Використовується, коли користувач має ввести переклад слова
 */
@Injectable()
export class WaitingForTranslationStrategy extends BaseStateStrategy {
  constructor() {
    super('WaitingForTranslation');
  }

  /**
   * Обробляє введений користувачем переклад
   */
  protected async processState(
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
      // Тут мало б бути отримання оригінального слова з кешу/стану
      // У спрощеному прикладі використовуємо заглушку
      const wordData = {
        word: 'Sample Word', // В реальному проекті це мало б братися з попередніх даних
        translation: dto.text,
        customerId: customer.id
      };

      // Зберігаємо слово в базу даних
      await this.saveWordToDatabase(
        wordData,
        wordService
      );

      // Відправляємо підтвердження збереження
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'savedWord',
        lang
      });

      // Повертаємося до головного меню
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
    } catch (error) {
      logError('Error saving word', error, {
        customerId: customer.id
      });

      // Повідомляємо про помилку
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'savedWordError',
        lang
      });

      // Повертаємося до головного меню
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
    }
  }

  /**
   * Допоміжний метод для збереження слова в базу даних
   */
  private async saveWordToDatabase(
    wordData: WordSaveData,
    wordService: WordService
  ): Promise<void> {
    // Приклад спрощеної імплементації
    await wordService.createWord({
      word: wordData.word,
      translation: wordData.translation,
      customerId: wordData.customerId
    });
  }

  /**
   * Повертає відповідне значення перерахування стану
   */
  protected getStateEnum(): CustomerState {
    return CustomerState.WaitingForTranslation;
  }
}
