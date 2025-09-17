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
 * Handler for main menu commands
 */
@Injectable()
export class MainMenuCommandHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    MainMenuCommandHandler.name
  );

  /**
   * Check if this handler can process the given command
   */
  canHandle(command: string): boolean {
    return (
      command === COMMANDS.START ||
      command === COMMANDS.MAIN_MENU
    );
  }

  /**
   * Execute main menu command logic
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { customerService, messageService } =
      services;

    return withErrorHandling(
      async () => {
        if (!customer) {
          this.logger.error(
            `No customer found for main menu command: ${dto.text}`
          );
        }

        // Update customer state to main menu
        await customerService.update({
          chatId: dto.chatId,
          state: CustomerState.MainMenu
        });

        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'mainMenu',
          lang
        });
      },
      `Failed to process main menu command: ${dto.text}`,
      dto.chatId,
      lang,
      messageService,
      { command: dto.text }
    );
  }
}
