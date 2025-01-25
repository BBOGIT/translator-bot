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
import { Customer } from './bot.types';
import {
  handleLearnWordsCommand,
  handleExistingCustomer,
  handleNewCustomer
} from './bot.handlers';

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
    private readonly config: BotConfig
  ) {}

  async checkState(
    dto: WebhookResponseDto
  ): Promise<Customer | null> {
    try {
      this.logger.log(
        `Отримано вебхук від Telegram: ${JSON.stringify(
          dto,
          null,
          2
        )}`
      );

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
              this.wordService,
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
              this.wordService,
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
            this.wordService
          );
      }
      return customer;
    } catch (err) {
      this.logger.error(
        `Помилка при обробці стану: ${err.message}`,
        err.stack
      );
      throw err;
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
      await this.messageService.TelegramSendMessage(
        {
          chatId,
          lang: lang,
          templateName: 'savedWord'
        }
      );
    } catch (error) {
      this.logger.error(
        `Помилка при збереженні слова: ${error.message}`
      );
      await this.messageService.TelegramSendMessage(
        {
          chatId,
          lang: lang,
          templateName: 'savedWordError'
        }
      );
      await this.messageService.TelegramSendMessage(
        {
          chatId,
          lang: lang,
          templateName: 'mainMenu'
        }
      );
    }
  }
}