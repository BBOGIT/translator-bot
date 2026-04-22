// src/jobs/word-repetition.job.ts
import {
  Injectable,
  Logger,
  Inject
} from '@nestjs/common';
import {
  Cron,
  CronExpression
} from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from '../message/message.service';
import { Word, Customer } from '@prisma/client';
import { WordService } from '../word/word.service';
import { CacheInterface } from '../cache/interfaces/cache.interface';
//import { addDays } from 'date-fns';

// Define the type for Word with Customer included
type WordWithCustomer = Word & {
  customer: Customer & {
    repetitionTime?: string | null;
  };
};

@Injectable()
export class WordRepetitionJob {
  private readonly logger = new Logger(
    WordRepetitionJob.name
  );


  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
    private readonly wordService: WordService,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  private readonly DEFAULT_REPETITION_HOUR = 20;

  private getEffectiveHour(
    repetitionTime: string | null
  ): number {
    if (!repetitionTime) {
      return this.DEFAULT_REPETITION_HOUR;
    }
    const hour = parseInt(
      repetitionTime.split(':')[0],
      10
    );
    return Number.isFinite(hour)
      ? hour
      : this.DEFAULT_REPETITION_HOUR;
  }

  private isAlreadyNotifiedToday(
    words: { lastNotificationAt: Date | null }[]
  ): boolean {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return words.every(
      word =>
        word.lastNotificationAt !== null &&
        word.lastNotificationAt >= todayMidnight
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleWordRepetition() {
    try {
      this.logger.log(
        'Hourly check for word repetitions'
      );
      const currentHour = new Date().getHours();

      const customers =
        await this.prisma.customer.findMany();

      const customersToNotify = customers.filter(
        customer =>
          this.getEffectiveHour(
            customer.repetitionTime
          ) === currentHour
      );

      for (const customer of customersToNotify) {
        const wordsToRepeat =
          await this.wordService.getWordsForRepetition(
            customer.id
          );

        if (wordsToRepeat.length === 0) {
          continue;
        }

        if (this.isAlreadyNotifiedToday(wordsToRepeat)) {
          this.logger.log(
            `Skipping customer ${customer.id}: all words already notified today`
          );
          continue;
        }

        const count = wordsToRepeat.length;
        const wordForm = this.getWordForm(count);

        await this.messageService.TelegramSendMessage(
          {
            chatId: customer.chatId,
            templateName: 'repetitionPrompt',
            lang: 'uk',
            dynamicVariables: {
              count: count.toString(),
              wordForm: wordForm
            }
          }
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling word repetitions: ${error.message}`,
        error.stack
      );
    }
  }

  private async findWordsForRepetition(): Promise<
    WordWithCustomer[]
  > {
    // Використовуємо WordService для отримання слів через CQRS
    return this.wordService.getWordsForRepetition();
  }

  private async sendRepetitionNotification(
    word: WordWithCustomer
  ) {
    try {
      // Обробка examples - парсинг JSON якщо потрібно
      let processedExamples = '';
      if (word.examples) {
        try {
          // Якщо examples є JSON-рядком, парсимо його
          const examplesArray = JSON.parse(
            word.examples
          );
          if (Array.isArray(examplesArray)) {
            processedExamples =
              examplesArray.join('\n');
          } else {
            processedExamples = word.examples;
          }
        } catch {
          // Якщо парсинг не вдався, використовуємо як є
          processedExamples = word.examples;
        }
      }

      const messageData = {
        chatId: word.customer.chatId,
        lang: 'uk',
        dynamicVariables: {
          word: word.word,
          translation: word.translation,
          examples: processedExamples
        },
        wordId: word.id.toString()
      };

      // Додаткове логування даних про відео та приклади
      this.logger.log(
        `[sendRepetitionNotification] Слово: "${word.word}", videoExample = "${word.videoExample}"`
      );
      this.logger.log(
        `[sendRepetitionNotification] Тип videoExample: ${typeof word.videoExample}, довжина: ${
          word.videoExample
            ? word.videoExample.length
            : 0
        }`
      );
      this.logger.log(
        `[sendRepetitionNotification] Examples: "${processedExamples}"`
      );

      // Відправляємо повідомлення в залежності від наявності відео
      if (
        word.videoExample &&
        word.videoExample !== 'null' &&
        word.videoExample.trim() !== ''
      ) {
        await this.messageService.TelegramSendMessage(
          {
            messageType: 'sendVideo',
            templateName: 'repeatWordsNow',
            videoUrl: word.videoExample,
            ...messageData
          }
        );
      } else {
        await this.messageService.TelegramSendMessage(
          {
            templateName: 'repeatWordsNowText',
            ...messageData
          }
        );
      }

      // Оновлюємо час останнього нагадування через CQRS
      await this.wordService.updateWordNotification(
        word.id
      );
    } catch (error) {
      this.logger.error(
        `Помилка при відправці нагадування для слова ${word.id}: ${error.message}`,
        error.stack
      );
    }
  }

  // Публічний метод для ручного оновлення статусу слова
  async updateWordRepetitionStatus(
    wordId: number,
    success: boolean
  ) {
    try {
      // Використовуємо WordService для оновлення статусу через CQRS
      return await this.wordService.updateWordRepetitionStatus(
        {
          wordId,
          success
        }
      );
    } catch (error) {
      this.logger.error(
        `Помилка при оновленні статусу повторення для слова ${wordId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Публічний метод для запуску повторення слів для конкретного користувача
   * Використовується для ручного запуску повторення слів з бота
   *
   * @param customerId ID користувача
   * @param chatId ID чату
   * @param lang Мова
   */
  async startRepetition(
    customerId: number,
    chatId: string,
    lang: string
  ): Promise<void> {
    try {
      this.logger.log(
        `Запуск повторення слів для користувача ${customerId}`
      );

      // Знаходимо слова для повторення для конкретного користувача через CQRS
      const wordsToRepeat =
        await this.wordService.getWordsForRepetition(
          customerId
        );

      if (wordsToRepeat.length === 0) {
        // Якщо слів для повторення немає, відправляємо повідомлення
        await this.messageService.TelegramSendMessage(
          {
            chatId,
            templateName: 'notFoundWords',
            lang
          }
        );
        return;
      }

      // Відправляємо повідомлення про початок повторення
      await this.messageService.TelegramSendMessage(
        {
          chatId,
          templateName: 'startRepetition',
          lang,
          dynamicVariables: {
            wordsCount:
              wordsToRepeat.length.toString()
          }
        }
      );

      // Зберігаємо ID слів у кеш для сесії
      const wordIds = wordsToRepeat.map(
        word => word.id
      );
      await this.cacheService.set(
        `repetition_session:${customerId}`,
        JSON.stringify(wordIds),
        3600 // Зберігаємо на годину
      );

      // Відправляємо перше слово
      if (wordsToRepeat.length > 0) {
        await this.sendRepetitionNotification(
          wordsToRepeat[0]
        );
      }

      this.logger.log(
        `Завершено ініціалізацію повторення для користувача ${customerId}`
      );
    } catch (error) {
      this.logger.error(
        `Помилка під час запуску повторення слів для користувача ${customerId}: ${error.message}`,
        error.stack
      );

      // Відправляємо повідомлення про помилку
      await this.messageService.TelegramSendMessage(
        {
          chatId,
          templateName: 'repetitionError',
          lang
        }
      );
    }
  }

  /**
   * Повертає правильну форму слова "слово" в залежності від кількості
   */
  private getWordForm(count: number): string {
    if (count === 1) {
      return 'слово';
    } else if (count >= 2 && count <= 4) {
      return 'слова';
    } else {
      return 'слів';
    }
  }
}
