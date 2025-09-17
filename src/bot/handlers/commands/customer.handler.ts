import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';

import { CustomerState } from '../../../customer/enum/customer-state.enum';
import { ChannelEnum } from '../../../customer/enum/channel.enum';
import { withErrorHandling } from '../core/error-handler';

/**
 * Handler for new customer onboarding and customer management
 */
@Injectable()
export class CustomerHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    CustomerHandler.name
  );

  /**
   * This handler is special and doesn't handle specific commands
   * It's used for customer initialization
   */
  canHandle(): boolean {
    // This handler doesn't directly handle commands
    return false;
  }

  /**
   * Process a new customer
   */
  async handleNewCustomer(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { customerService, messageService } =
      services;

    return withErrorHandling(
      async () => {
        this.logger.log(
          `Creating new customer for chat ${dto.chatId}`
        );

        // Create a new customer record
        const newCustomer =
          await customerService.create({
            chatId: dto.chatId,
            firstName: dto.firstName || null,
            lastName: dto.lastName || null,
            channel:
              (dto.channel as ChannelEnum) ||
              ChannelEnum.telegram,
            state: CustomerState.WelcomeMessage
          });

        this.logger.log(
          `New customer created: ${newCustomer.id}`
        );

        // Send welcome message
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'welcomeMessage',
          lang,
          dynamicVariables: {
            firstName: dto.firstName || '',
            lastName: dto.lastName || ''
          }
        });

        // Update state to main menu
        await customerService.update({
          chatId: dto.chatId,
          state: CustomerState.MainMenu
        });

        // Send main menu
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'mainMenu',
          lang
        });
      },
      'Failed to create new customer',
      dto.chatId,
      lang,
      messageService,
      {
        firstName: dto.firstName,
        lastName: dto.lastName
      }
    );
  }

  /**
   * Execute command logic - not directly used for this handler
   */
  async execute(): Promise<void> {
    // This handler is used directly by the bot service, not via command handling
    throw new Error(
      'CustomerHandler should not be called via execute()'
    );
  }
}
