// src/jobs/word-repetition.job.ts
import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  Cron,
  CronExpression
} from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from '../message/message.service';
//import { addDays } from 'date-fns';

@Injectable()
export class WordRepetitionJob {
  private readonly logger = new Logger(
    WordRepetitionJob.name
  );

  private readonly CRON_EXPRESSION =
    CronExpression.EVERY_HOUR;
  // Інтервали повторення винесені в окрему константу для кращої підтримки
  private readonly REPEAT_INTERVALS = [
    1, 3, 7, 14, 30, 90
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleWordRepetition() {
    try {
      this.logger.log(
        'Початок планової перевірки слів для повторення'
      );

      const wordsToRepeat =
        await this.findWordsForRepetition();

      for (const word of wordsToRepeat) {
        await this.sendRepetitionNotification(
          word
        );
        this.logger.debug(
          `Оброблено слово: ${word.word} для користувача ${word.customerId}`
        );
      }

      this.logger.log(
        `Завершено обробку ${wordsToRepeat.length} слів для повторення`
      );
    } catch (error) {
      this.logger.error(
        'Помилка під час обробки повторень слів:',
        error
      );
    }
  }

  private async findWordsForRepetition() {
    // Знаходимо слова, які потребують повторення
    return this.prisma.word.findMany({
      where: {
        needToLearn: false,
        // Перевіряємо, що не було нагадувань сьогодні
        OR: [
          { lastNotificationAt: null },
          {
            lastNotificationAt: {
              lt: new Date(
                new Date().setHours(0, 0, 0, 0)
              )
            }
          }
        ]
      },
      include: {
        customer: true
      }
    });
  }

  private async sendRepetitionNotification(
    word: any
  ) {
    try {
      const messageData = {
        chatId: word.customer.chatId,
        lang: 'uk',
        dynamicVariables: {
          word: word.word,
          translation: word.translation
        },
        wordId: word.id.toString()
      };

      // Додаткове логування даних про відео
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

      // Оновлюємо час останнього нагадування
      await this.prisma.word.update({
        where: { id: word.id },
        data: { lastNotificationAt: new Date() }
      });
    } catch (error) {
      this.logger.error(
        `Помилка при відправці нагадування для слова ${word.id}:`,
        error
      );
    }
  }

  // Публічний метод для ручного оновлення статусу слова
  async updateWordRepetitionStatus(
    wordId: number,
    success: boolean
  ) {
    try {
      const word =
        await this.prisma.word.findUnique({
          where: { id: wordId }
        });

      if (!word) {
        throw new Error(
          `Слово з ID ${wordId} не знайдено`
        );
      }

      const updates =
        this.calculateNextRepetition(
          word,
          success
        );

      await this.prisma.word.update({
        where: { id: wordId },
        data: updates
      });
    } catch (error) {
      this.logger.error(
        `Помилка при оновленні статусу повторення для слова ${wordId}:`,
        error
      );
      throw error;
    }
  }

  private calculateNextRepetition(
    word: any,
    success: boolean
  ) {
    if (success) {
      const currentRepeatCount =
        word.repeatCount || 0;
      const nextInterval =
        this.REPEAT_INTERVALS[
          Math.min(
            currentRepeatCount,
            this.REPEAT_INTERVALS.length - 1
          )
        ];

      return {
        repeatCount: currentRepeatCount + 1,
        lastRepeatAt: new Date(),
        needToLearn:
          currentRepeatCount + 1 <
          this.REPEAT_INTERVALS.length
      };
    } else {
      return {
        repeatCount: 0,
        lastRepeatAt: new Date(),
        needToLearn: true
      };
    }
  }
}
