import {
  Injectable,
  Logger
} from '@nestjs/common';
import { CustomerService } from '../../customer/customer.service';
import { MessageService } from '../../message/message.service';
import { WordService } from '../../word/word.service';
import { WebhookResponseDto } from '../../webhook/dto';
import {
  Customer,
  CustomerState
} from '../types/bot.types';
import { BotCommands } from '../enums/bot-commands.enum';
import { MessageTemplates } from '../enums/message-templates.enum';
import { format } from 'date-fns';
import { ChannelEnum } from 'src/customer/enum/channel.enum';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CommandHandler {
  private readonly logger = new Logger(
    CommandHandler.name
  );

  constructor(
    private customerService: CustomerService,
    private messageService: MessageService,
    private wordService: WordService,
    private redisService: RedisService
  ) {}

  async handleCommand(
    dto: WebhookResponseDto,
    customer: Customer,
    lang: string
  ): Promise<void> {
    try {
      switch (dto.text) {
        case BotCommands.START:
        case BotCommands.MAIN_MENU:
          await this.handleMainMenu(dto, lang); // Змінюємо параметри
          break;

        case BotCommands.REPEAT_WORDS:
          await this.handleRepeatWords(
            dto.chatId,
            lang
          );
          break;

        case BotCommands.MY_PROGRESS:
          await this.handleMyProgress(
            dto.chatId,
            customer.id,
            lang
          );
          break;

        case BotCommands.REPEAT_WORDS_NOW:
          await this.handleRepeatWordsNow(
            dto.chatId,
            customer.id,
            lang
          );
          break;

        default:
          if (
            dto.text.startsWith('/returnToLearn_')
          ) {
            await this.handleReturnToLearn(
              dto,
              customer.id,
              lang
            );
          } else if (
            dto.text.startsWith('/nextPage_') ||
            dto.text.startsWith('/previousPage_')
          ) {
            await this.handlePagination(
              dto,
              customer.id,
              lang
            );
          } else if (
            dto.text.startsWith(
              '/iHaveLearnedButton_'
            )
          ) {
            await this.handleWordLearned(
              dto,
              lang
            );
          } else {
            await this.handleUnknownCommand(
              dto.chatId,
              lang
            );
          }
      }
    } catch (error) {
      this.logger.error(
        `Error handling command: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async handleMainMenu(
    dto: WebhookResponseDto,
    lang: string
  ): Promise<void> {
    await this.customerService.create({
      chatId: dto.chatId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      channel: ChannelEnum.telegram,
      state: CustomerState.WelcomeMessage
    });

    await this.messageService.TelegramSendMessage(
      {
        chatId: dto.chatId,
        templateName: 'welcomeMessage',
        lang,
        dynamicVariables: {
          firstName: dto.firstName,
          lastName: dto.lastName
        }
      }
    );
  }

  async handleNewCustomer(
    dto: WebhookResponseDto,
    lang: string
  ): Promise<Customer> {
    const customer =
      await this.customerService.create({
        chatId: dto.chatId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        channel: ChannelEnum.telegram,
        state: CustomerState.WelcomeMessage
      });

    await this.messageService.TelegramSendMessage(
      {
        chatId: dto.chatId,
        templateName: MessageTemplates.WELCOME,
        lang,
        dynamicVariables: {
          firstName: dto.firstName,
          lastName: dto.lastName
        }
      }
    );

    return customer;
  }

  async handleVideo(
    dto: WebhookResponseDto,
    customer: Customer,
    lang: string
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

    await this.wordService.createWord({
      word,
      translation,
      videoExample: videoUrl,
      customerId: customer.id,
      needToLearn: true
    });

    await this.messageService.TelegramSendMessage(
      {
        chatId,
        templateName: MessageTemplates.SAVED_WORD,
        lang
      }
    );
  }

  public async handleExistingCustomer(
    dto: WebhookResponseDto,
    customer: Customer,
    lang: string
  ): Promise<void> {
    switch (customer.state) {
      case CustomerState.WelcomeMessage:
        await this.customerService.update({
          // Використовуємо this
          chatId: dto.chatId,
          state: CustomerState.MainMenu
        });
        await this.messageService.TelegramSendMessage(
          {
            // Використовуємо this
            chatId: dto.chatId,
            templateName: 'mainMenu',
            lang
          }
        );
        break;
      case CustomerState.WaitingForWord:
        await this.redisService.set(
          // Використовуємо this
          `word:${dto.chatId}`,
          dto.text,
          3600
        );
        await this.customerService.update({
          chatId: dto.chatId,
          state:
            CustomerState.WaitingForTranslation
        });
        await this.messageService.TelegramSendMessage(
          {
            chatId: dto.chatId,
            templateName: 'waitingForTranslation',
            lang
          }
        );
        break;
      case CustomerState.WaitingForTranslation:
        await this.redisService.set(
          `translation:${dto.chatId}`,
          dto.text,
          3600
        );
        await this.saveWordToDatabase(
          // Використовуємо this
          dto.chatId,
          customer
        );
        await this.messageService.TelegramSendMessage(
          {
            chatId: dto.chatId,
            templateName: 'savedWord',
            lang
          }
        );
        await this.messageService.TelegramSendMessage(
          {
            chatId: dto.chatId,
            templateName: 'mainMenu',
            lang
          }
        );
        await this.customerService.update({
          chatId: dto.chatId,
          state: CustomerState.MainMenu
        });
        break;
      default:
        this.logger.warn(
          `Невідомий стан користувача: ${customer.state}`
        );
        await this.customerService.update({
          chatId: dto.chatId,
          state: CustomerState.MainMenu
        });
        await this.messageService.TelegramSendMessage(
          {
            chatId: dto.chatId,
            templateName: 'mainMenu',
            lang
          }
        );
    }
  }

  private async saveWordToDatabase(
    chatId: string,
    customer: Customer
  ): Promise<void> {
    const word = await this.redisService.get(
      `word:${chatId}`
    );
    const translation =
      await this.redisService.get(
        `translation:${chatId}`
      );

    if (word && translation) {
      await this.wordService.createWord({
        word,
        translation,
        customerId: customer.id,
        videoExample: '', // Додаємо обов'язкове поле
        needToLearn: true
      });
      await this.redisService.del(
        `word:${chatId}`
      );
      await this.redisService.del(
        `translation:${chatId}`
      );
    }
  }

  private async handleMyProgress(
    chatId: string,
    customerId: number,
    lang: string
  ): Promise<void> {
    const { words, total, pages } =
      await this.wordService.getLearnedWordsWithPagination(
        customerId
      );

    const wordsList = this.formatWordsList(words);

    await this.messageService.TelegramSendMessage(
      {
        chatId,
        templateName: 'learnedWordsList',
        lang,
        dynamicVariables: {
          learnedWordsCount: total.toString(),
          wordsList,
          page: '1',
          totalPages: pages.toString()
        }
      }
    );
  }

  private async handleRepeatWords(
    chatId: string,
    lang: string
  ): Promise<void> {
    await this.customerService.update({
      chatId,
      state: CustomerState.RepeatWordsMain
    });
    await this.messageService.TelegramSendMessage(
      {
        chatId,
        templateName: 'repeatWords',
        lang
      }
    );
  }

  private async handleRepeatWordsNow(
    chatId: string,
    customerId: number,
    lang: string
  ): Promise<void> {
    await this.customerService.update({
      chatId,
      state: CustomerState.RepeatWordsNow
    });

    const words =
      await this.wordService.getWordsByCustomerId(
        customerId,
        true
      );

    if (words.length > 0) {
      const firstWord = words[0];
      await this.sendWordForRepeat(
        chatId,
        firstWord,
        lang
      );
    } else {
      await this.messageService.TelegramSendMessage(
        {
          chatId,
          templateName: 'notFoundWords',
          lang
        }
      );
    }
  }

  private async handleReturnToLearn(
    dto: WebhookResponseDto,
    customerId: number,
    lang: string
  ): Promise<void> {
    const wordId = Number(dto.text.split('_')[1]);
    await this.wordService.updateWord(wordId, {
      needToLearn: true
    });

    // Refresh the words list
    await this.handleMyProgress(
      dto.chatId,
      customerId,
      lang
    );
  }

  private async handlePagination(
    dto: WebhookResponseDto,
    customerId: number,
    lang: string
  ): Promise<void> {
    const currentPage = Number(
      dto.text.split('_')[1]
    );
    const isNext =
      dto.text.startsWith('/nextPage_');
    const newPage = isNext
      ? currentPage + 1
      : currentPage - 1;

    const { words, total, pages } =
      await this.wordService.getLearnedWordsWithPagination(
        customerId,
        newPage
      );

    await this.messageService.TelegramSendMessage(
      {
        chatId: dto.chatId,
        templateName: 'learnedWordsList',
        lang,
        dynamicVariables: {
          learnedWordsCount: total.toString(),
          wordsList: this.formatWordsList(words),
          page: newPage.toString(),
          totalPages: pages.toString()
        }
      }
    );
  }

  private async handleWordLearned(
    dto: WebhookResponseDto,
    lang: string
  ): Promise<void> {
    const wordId = Number(dto.text.split('_')[1]);
    await this.wordService.updateWord(wordId, {
      needToLearn: false
    });
    await this.messageService.TelegramSendMessage(
      {
        chatId: dto.chatId,
        templateName: MessageTemplates.OKAY,
        lang
      }
    );
  }

  private async handleUnknownCommand(
    chatId: string,
    lang: string
  ): Promise<void> {
    await this.customerService.update({
      chatId,
      state: CustomerState.MainMenu
    });
    await this.messageService.TelegramSendMessage(
      {
        chatId,
        templateName:
          MessageTemplates.NOT_FOUND_COMMAND,
        lang
      }
    );
  }

  private async sendWordForRepeat(
    chatId: string,
    word: any,
    lang: string
  ): Promise<void> {
    if (word.videoExample) {
      await this.messageService.TelegramSendMessage(
        {
          messageType: 'sendVideo',
          chatId,
          templateName: 'repeatWordsNow',
          lang,
          dynamicVariables: {
            word: word.word,
            translation: word.translation
          },
          wordId: word.id.toString(),
          videoUrl: word.videoExample
        }
      );
    } else {
      await this.messageService.TelegramSendMessage(
        {
          chatId,
          templateName: 'repeatWordsNowText',
          lang,
          dynamicVariables: {
            word: word.word,
            translation: word.translation
          },
          wordId: word.id.toString()
        }
      );
    }
  }

  private formatWordsList(words: any[]): string {
    return words
      .map(
        word =>
          `${word.word} - ${
            word.translation
          }\nВивчено: ${format(
            new Date(word.updatedAt),
            'dd.MM.yyyy HH:mm'
          )}`
      )
      .join('\n\n');
  }
}
