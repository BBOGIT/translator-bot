import { Injectable, Logger } from '@nestjs/common';
import { CommandContext, CommandHandler } from '../core/interfaces';
import { COMMANDS } from '../core/constants';
import { withErrorHandling } from '../core/error-handler';

const DEFAULT_REPETITION_TIME = '20:00';

@Injectable()
export class RemindLaterHandler implements CommandHandler {
  private readonly logger = new Logger(RemindLaterHandler.name);

  canHandle(command: string): boolean {
    return command === COMMANDS.REMIND_LATER;
  }

  async execute(context: CommandContext): Promise<void> {
    const { dto, lang, customer, services } = context;
    const { messageService } = services;

    return withErrorHandling(
      async () => {
        const repetitionTime =
          customer?.repetitionTime ?? DEFAULT_REPETITION_TIME;

        this.logger.log(
          `Remind later for customer ${customer?.id}, next at ${repetitionTime}`
        );

        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'remindLaterConfirm',
          lang,
          dynamicVariables: { repetitionTime }
        });
      },
      `Failed to process remindLater command`,
      dto.chatId,
      lang,
      messageService,
      { command: dto.text }
    );
  }
}
