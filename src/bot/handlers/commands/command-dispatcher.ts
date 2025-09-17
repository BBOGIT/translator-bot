import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { MainMenuCommandHandler } from './main-menu.handler';
import { LearnWordsCommandHandler } from '../words/learn-words.handler';
import { RepetitionCommandHandler } from '../repetition/repetition.handler';
import { ProgressCommandHandler } from './progress.handler';
import { WordProcessingHandler } from '../words/word.handler';
import { CustomerHandler } from './customer.handler';
import { StateHandler } from '../states/state-handler';
import { sendErrorMessage } from '../core/error-handler';
import { LearningWordsHandler } from '../words/learning-words.handler';
import { WordTranslationHandler } from '../words/word-translation.handler';
import { WordRepetitionHandler } from '../repetition/word-repetition.handler';
import { CustomerService } from '../../../customer/customer.service';
import { MessageService } from '../../../message/message.service';
import { AiService } from '../../../ai/ai.service';
import { WordService } from '../../../word/word.service';
import { WebhookTypeEnum } from '../../../webhook/enum';

/**
 * Command dispatcher that routes commands to appropriate handlers
 */
@Injectable()
export class CommandDispatcher {
  private readonly logger = new Logger(
    CommandDispatcher.name
  );
  private readonly callbackQueryHandlers: CommandHandler[] =
    [];
  private readonly textCommandHandlers: CommandHandler[] =
    [];

  constructor(
    private readonly mainMenuHandler: MainMenuCommandHandler,
    private readonly learnWordsHandler: LearnWordsCommandHandler,
    private readonly repetitionHandler: RepetitionCommandHandler,
    private readonly progressHandler: ProgressCommandHandler,
    private readonly wordHandler: WordProcessingHandler,
    private readonly customerHandler: CustomerHandler,
    private readonly stateHandler: StateHandler,
    private readonly learningWordsHandler: LearningWordsHandler,
    private readonly wordTranslationHandler: WordTranslationHandler,
    private readonly wordRepetitionHandler: WordRepetitionHandler,
    private readonly customerService: CustomerService,
    private readonly messageService: MessageService,
    private readonly aiService: AiService,
    private readonly wordService: WordService
  ) {
    // Register handlers for callback queries (button clicks)
    this.callbackQueryHandlers = [
      mainMenuHandler,
      learnWordsHandler,
      repetitionHandler,
      progressHandler,
      wordRepetitionHandler
    ];

    // Register handlers for text commands
    this.textCommandHandlers = [
      mainMenuHandler,
      learnWordsHandler,
      repetitionHandler,
      progressHandler,
      learningWordsHandler,
      wordTranslationHandler,
      wordRepetitionHandler,
      // Застарілий обробник для зворотної сумісності
      wordHandler
    ];
  }

  /**
   * Dispatch a command to the appropriate handler
   * @param context CommandContext containing the command and required data
   */
  async dispatchCommand(
    context: CommandContext
  ): Promise<void> {
    const { dto, customer, lang, services } =
      context;
    const { messageService } = services;
    let handlerFound = false;

    try {
      const command = dto.text;
      this.logger.log(
        `Dispatching command: ${command}, customer state: ${customer?.state}, webhookType: ${dto.webhookType}`
      );

      // Handle new customer first if no customer exists
      if (!customer) {
        this.logger.log(
          `No customer found for command: ${command}, creating new customer`
        );
        await this.customerHandler.handleNewCustomer(
          context
        );
        return;
      }

      // 1. Priority handling for callback queries (button clicks)
      if (
        dto.webhookType ===
        WebhookTypeEnum.callbackQuery
      ) {
        for (const handler of this
          .callbackQueryHandlers) {
          if (
            handler.canHandle(
              command,
              customer?.state
            )
          ) {
            this.logger.log(
              `Callback query handler found: ${handler.constructor.name}`
            );
            await handler.execute(context);
            return;
          }
        }
      }

      // 2. Handle messages based on customer state
      if (
        this.stateHandler.canHandle(
          command,
          customer.state
        )
      ) {
        await this.stateHandler.execute(context);
        return;
      }

      // 3. Handle other text messages and commands
      for (const handler of this
        .textCommandHandlers) {
        if (
          handler.canHandle(
            command,
            customer?.state
          )
        ) {
          this.logger.log(
            `Text command handler found: ${handler.constructor.name}`
          );
          await handler.execute(context);
          handlerFound = true;
          break;
        }
      }

      // Handle unrecognized commands
      if (!handlerFound) {
        this.logger.warn(
          `No handler found for command: ${command}`
        );

        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'notFoundCommand',
          lang
        });
      }
    } catch (error) {
      this.logger.error(
        `Error dispatching command: ${error.message}`,
        error.stack
      );

      await sendErrorMessage(
        dto.chatId,
        lang,
        messageService
      );
    }
  }
}
