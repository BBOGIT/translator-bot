import {
  Injectable,
  Logger,
  Inject
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { COMMANDS } from '../core/constants';
import { CustomerState } from '../../../customer/enum/customer-state.enum';
import { withErrorHandling } from '../core/error-handler';
import { WordRepetitionJob } from '../../../jobs/word-repetition.job';
import { CacheInterface } from '../../../cache/interfaces/cache.interface';
import {
  ExtendedCustomer,
  getRepetitionTime
} from '../../../customer/interfaces/extended-customer.interface';

/**
 * Handler for word repetition commands
 */
@Injectable()
export class RepetitionCommandHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    RepetitionCommandHandler.name
  );

  constructor(
    private readonly wordRepetitionJob: WordRepetitionJob,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  /**
   * Check if this handler can process the given command
   */
  canHandle(command: string): boolean {
    return (
      [
        COMMANDS.REPEAT_WORDS,
        COMMANDS.REPEAT_WORDS_NOW,
        COMMANDS.REPEAT_WORDS_SCHEDULE,
        COMMANDS.REPEAT_WORDS_SCHEDULE_WEEK,
        COMMANDS.REPEAT_WORDS_SCHEDULE_MONTH,
        COMMANDS.VIEW_SETTINGS
      ].includes(command) ||
      command.startsWith(COMMANDS.PREVIOUS_WORD) ||
      command.startsWith(COMMANDS.NEXT_WORD)
    );
  }

  /**
   * Execute repetition command logic
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
          `Processing repetition command: ${dto.text}`
        );

        if (dto.text === COMMANDS.REPEAT_WORDS) {
          await customerService.update({
            chatId: dto.chatId,
            state: CustomerState.RepeatWordsMain
          });

          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'repeatWords',
              lang
            }
          );
        } else if (
          dto.text === COMMANDS.REPEAT_WORDS_NOW
        ) {
          await customerService.update({
            chatId: dto.chatId,
            state: CustomerState.RepeatWordsNow
          });

          await this.handleRepeatWordsNow(
            context
          );
        } else if (
          dto.text ===
          COMMANDS.REPEAT_WORDS_SCHEDULE
        ) {
          await this.handleRepeatWordsSchedule(
            context
          );
        } else if (
          dto.text ===
          COMMANDS.REPEAT_WORDS_SCHEDULE_WEEK
        ) {
          await this.handleScheduleWeek(context);
        } else if (
          dto.text ===
          COMMANDS.REPEAT_WORDS_SCHEDULE_MONTH
        ) {
          await this.handleScheduleMonth(context);
        } else if (
          dto.text === COMMANDS.VIEW_SETTINGS
        ) {
          await this.handleViewSettings(context);
        } else if (
          dto.text.startsWith(
            COMMANDS.NEXT_WORD
          ) ||
          dto.text.startsWith(
            COMMANDS.PREVIOUS_WORD
          )
        ) {
          await this.handleWordNavigation(
            context
          );
        }

        this.logger.log(
          `Repetition command processed successfully for chat ${dto.chatId}`
        );
      },
      `Failed to process repetition command: ${dto.text}`,
      dto.chatId,
      lang,
      messageService,
      { command: dto.text }
    );
  }

  /**
   * Handle the /repeatWordsNow command
   */
  private async handleRepeatWordsNow(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer } = context;

    if (!customer) {
      this.logger.error(
        `No customer found for repetition: ${dto.text}`
      );
      return;
    }

    await this.wordRepetitionJob.startRepetition(
      customer.id,
      dto.chatId,
      lang
    );
  }

  /**
   * Handle the /repeatWordsSchedule command
   */
  private async handleRepeatWordsSchedule(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { customerService, messageService } =
      services;

    await customerService.update({
      chatId: dto.chatId,
      state:
        CustomerState.WaitingForRepetitionTime
    });

    // Отримуємо поточний час користувача для відображення
    const currentTime =
      new Date().toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'askForRepetitionTime',
      lang,
      dynamicVariables: {
        currentTime: currentTime
      }
    });
  }

  /**
   * Handle the /repeatWordsScheduleWeek command
   */
  private async handleScheduleWeek(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { customerService, messageService } =
      services;

    // Встановлюємо фіксований час для тижневих нагадувань (понеділок 18:00)
    await customerService.update({
      chatId: dto.chatId,
      repetitionTime: '18:00', // Можна зробити налаштовуваним пізніше
      state: CustomerState.MainMenu
    });

    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'repetitionTimeConfirmed',
      lang,
      dynamicVariables: {
        time: '18:00 (щопонеділка)'
      }
    });
  }

  /**
   * Handle the /repeatWordsScheduleMonth command
   */
  private async handleScheduleMonth(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { customerService, messageService } =
      services;

    // Встановлюємо фіксований час для місячних нагадувань (1 число 18:00)
    await customerService.update({
      chatId: dto.chatId,
      repetitionTime: '18:00', // Можна зробити налаштовуваним пізніше
      state: CustomerState.MainMenu
    });

    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'repetitionTimeConfirmed',
      lang,
      dynamicVariables: {
        time: '18:00 (щомісяця, 1 числа)'
      }
    });
  }

  /**
   * Handle the /viewSettings command
   */
  private async handleViewSettings(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { messageService } = services;

    if (!customer) {
      this.logger.error(
        `No customer found for view settings: ${dto.chatId}`
      );
      return;
    }

    const currentRepetitionTime = getRepetitionTime(
      customer as ExtendedCustomer,
      '20:00'
    );
    const settingsDetails = (customer as ExtendedCustomer)
      .repetitionTime
      ? '✅ Налаштування збережено'
      : '⚠️ Використовується час за замовчуванням';

    await messageService.TelegramSendMessage({
      chatId: dto.chatId,
      templateName: 'viewSettings',
      lang,
      dynamicVariables: {
        currentRepetitionTime:
          currentRepetitionTime,
        settingsDetails: settingsDetails
      }
    });
  }

  /**
   * Handle navigation between words during repetition
   */
  private async handleWordNavigation(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { wordService, messageService } =
      services;

    const commandParts = dto.text.split('_');
    if (commandParts.length < 2) {
      this.logger.error(
        `Invalid command format: ${dto.text}`
      );
      return;
    }

    const action = commandParts[0];
    const currentWordId = parseInt(
      commandParts[commandParts.length - 1],
      10
    );

    const sessionCacheKey = `repetition_session:${customer.id}`;
    const sessionData =
      await this.cacheService.get(
        sessionCacheKey
      );

    if (typeof sessionData !== 'string') {
      this.logger.warn(
        `No repetition session data found or data is not a string for customer ${customer.id}`
      );
      // Optionally, send a message to the user
      return;
    }

    const wordIds: number[] =
      JSON.parse(sessionData);
    const currentIndex = wordIds.indexOf(
      currentWordId
    );

    if (currentIndex === -1) {
      this.logger.error(
        `Word ${currentWordId} not in session for customer ${customer.id}`
      );
      return;
    }

    let nextIndex;
    if (action === 'next') {
      nextIndex =
        (currentIndex + 1) % wordIds.length;
    } else {
      // previous
      nextIndex =
        (currentIndex - 1 + wordIds.length) %
        wordIds.length;
    }

    const nextWordId = wordIds[nextIndex];
    const nextWord =
      await wordService.getWordById(nextWordId);

    if (!nextWord) {
      this.logger.error(
        `Word with ID ${nextWordId} not found`
      );
      return;
    }

    if (
      !dto.originalWebhook.callback_query?.message
        ?.message_id
    ) {
      this.logger.error(
        `Message ID not found in callback query for chat ${dto.chatId}`
      );
      return;
    }

    // TODO: Implement editMessageText in MessageService
    await messageService.TelegramEditMessage(
      dto.chatId,
      dto.originalWebhook.callback_query.message.message_id.toString(), // Assuming messageId is available in dto
      'repeatWordsNowText', // Use the same or a similar template
      lang,
      {
        word: nextWord.word,
        translation: nextWord.translation,
        wordId: nextWord.id.toString()
        // Add other dynamic variables as needed
      }
    );
  }
}
