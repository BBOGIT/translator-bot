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
import { withErrorHandling } from '../core/error-handler';

/**
 * Handler for learn words commands
 */
@Injectable()
export class LearnWordsCommandHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    LearnWordsCommandHandler.name
  );

  /**
   * Check if this handler can process the given command
   */
  canHandle(
    command: string,
    customerState?: string
  ): boolean {
    return command === COMMANDS.LEARN_WORDS;
  }

  /**
   * Execute learn words command logic
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { customerService, messageService } =
      services;

    return withErrorHandling(
      async () => {
        this.logger.log(
          `Processing learn words command: ${dto.text}`
        );

        // Update customer state to waiting for word input
        await customerService.update({
          chatId: dto.chatId,
          state: CustomerState.WaitingForWordInput
        });

        // Send waiting for word input message
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'waitingForWordInput',
          lang
        });

        this.logger.log(
          `Learn words command processed successfully for chat ${dto.chatId}`
        );
      },
      `Failed to process learn words command: ${dto.text}`,
      dto.chatId,
      lang,
      messageService,
      { command: dto.text }
    );
  }
}
