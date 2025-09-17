import { Injectable } from '@nestjs/common';
import { CommandContext } from '../handlers/core/interfaces';
import { BaseStateStrategy } from './base-state.strategy';
import { CustomerState } from '../../customer/enum/customer-state.enum';
import { COMMANDS } from '../handlers/core/constants';

/**
 * Стратегія для обробки стану MainMenu
 *
 * Використовується для обробки команд у головному меню
 */
@Injectable()
export class MainMenuStrategy extends BaseStateStrategy {
  constructor() {
    super('MainMenu');
  }

  /**
   * Перевизначаємо базовий метод canHandle для додаткової логіки
   */
  canHandle(
    command: string,
    context: CommandContext
  ): boolean {
    // Базова перевірка стану
    const isCorrectState = super.canHandle(
      command,
      context
    );

    // Можна додати додаткові перевірки для конкретних команд у стані MainMenu
    return isCorrectState;
  }

  /**
   * Обробляє команди в стані головного меню
   */
  protected async processState(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { customerService, messageService } =
      services;
    const command = dto.text;

    // Обробка різних команд у стані головного меню
    if (
      command === COMMANDS.MAIN_MENU ||
      command === COMMANDS.START
    ) {
      // Відправляємо головне меню
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
      // Залишаємося в тому ж стані
    } else if (command === COMMANDS.LEARN_WORDS) {
      // Переходимо до стану очікування введення слова
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.WaitingForWordInput
      });

      // Відправляємо повідомлення про очікування введення слова
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'waitingForWordInput',
        lang
      });
    } else if (
      command === COMMANDS.REPEAT_WORDS
    ) {
      // Переходимо до стану повторення слів
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.RepeatWordsMain
      });

      // Відправляємо меню повторення слів
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'repeatWords',
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
    return CustomerState.MainMenu;
  }
}
