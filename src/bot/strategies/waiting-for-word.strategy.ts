import { Injectable } from '@nestjs/common';
import { CommandContext } from '../handlers/core/interfaces';
import { BaseStateStrategy } from './base-state.strategy';
import { CustomerState } from '../../customer/enum/customer-state.enum';

/**
 * Стратегія для обробки стану WaitingForWord
 *
 * Використовується, коли користувач має ввести слово для перекладу
 */
@Injectable()
export class WaitingForWordStrategy extends BaseStateStrategy {
  constructor() {
    super('WaitingForWord');
  }

  /**
   * Обробляє введене користувачем слово
   */
  protected async processState(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const {
      customerService,
      messageService,
      aiService
    } = services;

    // Запам'ятовуємо введене слово у кеші або в іншому стані (в цьому прикладі пропускаємо)

    // Відправляємо повідомлення про очікування перекладу
    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'waitingForTranslation',
      lang
    });

    // Оновлюємо стан користувача
    await customerService.update({
      chatId: dto.chatId,
      state: CustomerState.WaitingForTranslation
    });
  }

  /**
   * Повертає відповідне значення перерахування стану
   */
  protected getStateEnum(): CustomerState {
    return CustomerState.WaitingForWord;
  }
}
