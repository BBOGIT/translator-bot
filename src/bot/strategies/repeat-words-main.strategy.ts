import { Injectable } from '@nestjs/common';
import { CommandContext } from '../handlers/core/interfaces';
import { BaseStateStrategy } from './base-state.strategy';
import { CustomerState } from '../../customer/enum/customer-state.enum';
import { COMMANDS } from '../handlers/core/constants';

/**
 * Стратегія для обробки стану RepeatWordsMain
 *
 * Використовується для обробки команд у меню повторення слів
 */
@Injectable()
export class RepeatWordsMainStrategy extends BaseStateStrategy {
  constructor() {
    super('RepeatWordsMain');
  }

  /**
   * Обробляє команди в стані меню повторення слів
   */
  protected async processState(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const {
      customerService,
      messageService,
      wordRepetitionJob
    } = services;
    const command = dto.text;

    // Обробка різних команд у стані меню повторення слів
    if (command === COMMANDS.REPEAT_WORDS_NOW) {
      // Переходимо до стану активного повторення слів
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.RepeatWordsNow
      });

      // Запускаємо повторення слів зараз для конкретного користувача
      await wordRepetitionJob.startRepetition(
        customer.id,
        dto.chatId,
        lang
      );
    } else if (
      command === COMMANDS.REPEAT_WORDS_SCHEDULE
    ) {
      await customerService.update({
        chatId: dto.chatId,
        state:
          CustomerState.WaitingForRepetitionTime
      });

      // Отримуємо поточний час користувача для відображення
      const currentTime = new Date().toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Відправляємо меню налаштування розкладу повторень
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'askForRepetitionTime',
        lang,
        dynamicVariables: {
          currentTime: currentTime
        }
      });
    } else if (command === COMMANDS.VIEW_SETTINGS) {
      // Показуємо поточні налаштування
      const currentRepetitionTime = (customer as any)?.repetitionTime || '20:00';
      const settingsDetails = (customer as any)?.repetitionTime 
        ? '✅ Налаштування збережено'
        : '⚠️ Використовується час за замовчуванням';

      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'viewSettings',
        lang,
        dynamicVariables: {
          currentRepetitionTime: currentRepetitionTime,
          settingsDetails: settingsDetails
        }
      });
    } else if (command === COMMANDS.MAIN_MENU) {
      // Повертаємося до головного меню
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });

      // Відправляємо головне меню
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
    } else {
      // Якщо команда не розпізнана, відправляємо повідомлення про невідому команду
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'notFoundCommand',
        lang
      });
    }
  }

  /**
   * Повертає відповідне значення перерахування стану
   */
  protected getStateEnum(): CustomerState {
    return CustomerState.RepeatWordsMain;
  }
}
