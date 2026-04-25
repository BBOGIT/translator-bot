import { Injectable } from '@nestjs/common';
import { BaseStateStrategy } from './base-state.strategy';
import { CommandContext } from '../handlers/core/interfaces';
import { CustomerState } from '../../customer/enum/customer-state.enum';

@Injectable()
export class WaitingForRepetitionTimeStrategy extends BaseStateStrategy {
  getStateEnum(): CustomerState {
    return CustomerState.WaitingForRepetitionTime;
  }

  protected async processState(
    context: CommandContext
  ): Promise<void> {
    const { dto, services, lang } = context;
    const { customerService, messageService } =
      services;
    const command = dto.text;

    // Обробка callback buttons з попередньо налаштованими часами
    const predefinedTimes = [
      '07:00',
      '09:00',
      '19:00',
      '21:00'
    ];
    if (predefinedTimes.includes(command)) {
      await this.setRepetitionTime(
        command,
        context
      );
      return;
    }

    // Обробка кнопки "custom_time"
    if (command === 'custom_time') {
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.WaitingForCustomTime
      });

      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'customTimePrompt',
        lang
      });
      return;
    }

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
