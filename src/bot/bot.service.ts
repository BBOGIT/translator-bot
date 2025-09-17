import {
  Injectable,
  Logger
} from '@nestjs/common';
import { CustomerService } from '../customer/customer.service';
import { MessageService } from '../message/message.service';
import { WebhookResponseDto } from '../webhook/dto';
import { RedisService } from '../redis/redis.service';
import { WordService } from '../word/word.service';
import { BotConfig } from './bot.config';
import { Customer } from '../customer/types/customer.type';
import { WordRepetitionJob } from '../jobs/word-repetition.job';
import { TelegramService } from '../telegram/telegram.service';
import { AiService } from '../ai/ai.service';
import {
  CommandDispatcher,
  CommandContext
} from './handlers';

@Injectable()
export class BotService {
  private readonly logger = new Logger(
    BotService.name
  );

  constructor(
    private readonly customerService: CustomerService,
    private readonly messageService: MessageService,
    private readonly redisService: RedisService,
    private readonly wordService: WordService,
    private readonly config: BotConfig,
    private readonly wordRepetitionJob: WordRepetitionJob,
    private readonly telegramService: TelegramService,
    private readonly aiService: AiService,
    private readonly commandDispatcher: CommandDispatcher
  ) {}

  /**
   * Handle a webhook response by dispatching to appropriate handlers
   * @param dto The webhook response DTO
   */
  async handleWebhookResponse(
    dto: WebhookResponseDto
  ): Promise<void> {
    try {
      const lang = this.validateLanguage(
        dto.lang
      );

      const customer =
        await this.customerService.findByChatId(
          dto.chatId
        );

      // Create command context for handlers
      const context: CommandContext = {
        dto,
        lang,
        customer,
        services: {
          customerService: this.customerService,
          messageService: this.messageService,
          wordService: this.wordService,
          telegramService: this.telegramService,
          aiService: this.aiService,
          wordRepetitionJob:
            this.wordRepetitionJob
        }
      };

      // Dispatch command to appropriate handler
      await this.commandDispatcher.dispatchCommand(
        context
      );
    } catch (error) {
      this.logger.error(
        `Error handling webhook response: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Validate the language code and return a supported language
   * @param lang Language code to validate
   * @returns A supported language code
   */
  private validateLanguage(lang: string): string {
    if (
      !this.config.supportedLanguages.includes(
        lang
      )
    ) {
      return this.config.defaultLanguage;
    }
    return lang;
  }

  private async processVideoWebhook(
    dto: WebhookResponseDto,
    lang: string,
    customer: Customer
  ): Promise<void> {
    const { text, chatId } = dto;
    const [wordPart, ...rest] = text.split(' - ');
    const translationPart = rest
      .join(' - ')
      .split('\n\n')[0];
    const word = wordPart
      .trim()
      .replace(/[^a-zA-Z\s]/g, '');
    const translation = translationPart.trim();
    const videoUrl =
      dto.originalWebhook.message.video.file_id;

    try {
      await this.wordService.createWord({
        word,
        translation,
        videoExample: videoUrl,
        customerId: customer.id,
        needToLearn: true
      });

      this.logger.log(
        `Збережено нове слово: ${word}`
      );

      const result =
        await this.messageService.TelegramSendMessage(
          {
            chatId,
            lang: lang,
            templateName: 'savedWord'
          }
        );

      if (!result.ok) {
        this.logger.error(
          `Помилка при відправленні повідомлення про збереження слова: ${JSON.stringify(
            result
          )}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Помилка при збереженні слова: ${error.message}`
      );

      const errorResult =
        await this.messageService.TelegramSendMessage(
          {
            chatId,
            lang: lang,
            templateName: 'savedWordError'
          }
        );

      if (!errorResult.ok) {
        this.logger.error(
          `Помилка при відправленні повідомлення про помилку: ${JSON.stringify(
            errorResult
          )}`
        );
      }

      const menuResult =
        await this.messageService.TelegramSendMessage(
          {
            chatId,
            lang: lang,
            templateName: 'mainMenu'
          }
        );

      if (!menuResult.ok) {
        this.logger.error(
          `Помилка при відправленні головного меню: ${JSON.stringify(
            menuResult
          )}`
        );
      }
    }
  }
}
