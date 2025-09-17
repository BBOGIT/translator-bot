import { Injectable } from '@nestjs/common';
import { BaseStateStrategy } from './base-state.strategy';
import { CommandContext } from '../handlers/core/interfaces';
import { CustomerState } from '../../customer/enum/customer-state.enum';

@Injectable()
export class WaitingForCustomTimeStrategy extends BaseStateStrategy {
  getStateEnum(): CustomerState {
    return CustomerState.WaitingForCustomTime;
  }

  protected async processState(
    context: CommandContext
  ): Promise<void> {
    const { dto, services, lang } = context;
    const { customerService, messageService } = services;
    const command = dto.text;

    // Обробка ручного введення часу
    const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;
    if (timeRegex.test(command)) {
      await this.setRepetitionTime(command, context);
    } else {
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'repetitionTimeError',
        lang
      });
      // Залишаємося в тому ж стані, щоб користувач міг спробувати ще раз
    }
  }

  private async setRepetitionTime(
    time: string,
    context: CommandContext
  ): Promise<void> {
    const { dto, services, lang } = context;
    const { customerService, messageService } = services;

    await customerService.update({
      chatId: dto.chatId,
      repetitionTime: time,
      state: CustomerState.MainMenu
    });

    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'repetitionTimeConfirmed',
      lang,
      dynamicVariables: {
        time: time
      }
    });
  }
}


