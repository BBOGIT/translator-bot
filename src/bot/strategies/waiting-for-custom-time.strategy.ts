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
    const { customerService, messageService } =
      services;
    const command = dto.text;

    // Обробка ручного введення часу (тільки година: 0-23)
    const timeRegex = /^([01]?[0-9]|2[0-3])$/;
    if (timeRegex.test(command)) {
      await this.setRepetitionTime(
        command,
        context
      );
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
    const { customerService, messageService } =
      services;

    const normalizedTime =
      time.split(':')[0].padStart(2, '0') + ':00';

    await customerService.update({
      chatId: dto.chatId,
      repetitionTime: normalizedTime,
      state: CustomerState.MainMenu
    });

    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'repetitionTimeConfirmed',
      lang,
      dynamicVariables: {
        time: normalizedTime
      }
    });
  }
}
