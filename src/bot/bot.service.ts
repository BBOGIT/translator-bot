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
import { Customer } from '../customer/types';
import {
  handleLearnWordsCommand,
  handleExistingCustomer,
  handleNewCustomer
} from './bot.handlers';
import { WordRepetitionJob } from 'src/jobs/word-repetition.job';
import { TelegramService } from '../telegram/telegram.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class BotService {
  private readonly logger = new Logger(
    BotService.name
  );

  constructor(
    private customerService: CustomerService,
    private messageService: MessageService,
    private readonly redisService: RedisService,
    private readonly wordService: WordService,
    private readonly config: BotConfig,
    private wordRepetitionJob: WordRepetitionJob,
    private readonly telegramService: TelegramService,
    private readonly aiService: AiService
  ) {}

  async checkState(
    dto: WebhookResponseDto
  ): Promise<Customer | null> {
    try {
      // this.logger.log(
      //   `Отримано вебхук від Telegram: ${JSON.stringify(
      //     dto,
      //     null,
      //     2
      //   )}`
      // );

      const validatedLang = this.validateLanguage(
        dto.lang
      );
      const customer =
        await this.customerService.find({
          chatId: dto.chatId
        });

      if (!customer) {
        await handleNewCustomer(
          dto,
          validatedLang,
          this.customerService,
          this.messageService
        );
      }

      switch (dto.webhookType) {
        case 'video':
          await this.processVideoWebhook(
            dto,
            validatedLang,
            customer
          );
          break;
        case 'callbackQuery':
          if (dto.text.startsWith('/')) {
            await handleLearnWordsCommand(
              dto,
              validatedLang,
              this.customerService,
              this.messageService,
              this.wordRepetitionJob,
              this.wordService,
              this.telegramService,
              this.aiService,
              customer
            );
          }
          break;
        case 'text':
          if (dto.text.startsWith('/')) {
            await handleLearnWordsCommand(
              dto,
              validatedLang,
              this.customerService,
              this.messageService,
              this.wordRepetitionJob,
              this.wordService,
              this.telegramService,
              this.aiService,
              customer
            );
            break;
          }
        default:
          await handleExistingCustomer(
            dto,
            customer,
            validatedLang,
            this.customerService,
            this.messageService,
            this.redisService,
            this.wordService,
            this.telegramService,
            this.aiService
          );
      }
      return customer;
    } catch (err) {
      this.logger.error(
        `Помилка при обробці стану: ${err.message}`,
        err.stack
      );
      return null;
    }
  }

  private validateLanguage(lang: string): string {
    if (
      !this.config.supportedLanguages.includes(
        lang
      )
    ) {
      this.logger.warn(
        `Непідтримувана мова: ${lang}. Використовується мова за замовчуванням: ${this.config.defaultLanguage}`
      );
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
