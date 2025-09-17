import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { COMMANDS } from '../core/constants';
import { format } from 'date-fns';
import {
  withErrorHandling,
  logError
} from '../core/error-handler';
import { UserProgressStats } from '../../../word/word.service';

// Тип для кнопки Telegram
interface InlineKeyboardButton {
  text: string;
  callback_data: string;
  // Додайте інші поля кнопки, якщо потрібно (напр., url)
}

// Тип LearnedWordSummary видалено оскільки тепер використовуємо детальну статистику

/**
 * Handler for progress tracking commands
 */
@Injectable()
export class ProgressCommandHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    ProgressCommandHandler.name
  );

  /**
   * Check if this handler can process the given command
   */
  canHandle(command: string): boolean {
    return (
      command === COMMANDS.MY_PROGRESS ||
      command.startsWith(
        COMMANDS.PREVIOUS_PAGE
      ) ||
      command.startsWith(COMMANDS.NEXT_PAGE)
    );
  }

  /**
   * Execute progress command logic
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { messageService } = services;

    if (!customer) {
      this.logger.error(
        `No customer found for progress command: ${dto.text}`
      );
      return;
    }

    return withErrorHandling(
      async () => {
        this.logger.log(
          `Processing progress command: ${dto.text}`
        );

        // Handle different progress commands
        if (dto.text === COMMANDS.MY_PROGRESS) {
          await this.handleMyProgress(context);
        } else if (
          dto.text.startsWith(
            COMMANDS.NEXT_PAGE
          ) ||
          dto.text.startsWith(
            COMMANDS.PREVIOUS_PAGE
          )
        ) {
          // Для пагінації показуємо той же детальний прогрес
          await this.handleMyProgress(context);
        }

        this.logger.log(
          `Progress command processed successfully for chat ${dto.chatId}`
        );
      },
      `Failed to process progress command: ${dto.text}`,
      dto.chatId,
      lang,
      messageService,
      {
        command: dto.text,
        customerId: customer.id
      }
    );
  }

  // Метод extractPageNumber видалено оскільки тепер використовуємо детальну статистику замість пагінації

  /**
   * Handle the /myProgress command with detailed statistics
   */
  private async handleMyProgress(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { wordService, messageService } =
      services;

    try {
      this.logger.log(
        `Fetching detailed progress for customer ${customer?.id}`
      );

      // Отримуємо детальну статистику
      const progressStats: UserProgressStats =
        await wordService.getUserProgressStats(
          customer.id
        );

      // Формуємо детальний текст прогресу
      const progressText =
        this.formatProgressText(progressStats);

      // Створюємо кнопки для детального прогресу
      const buttonsArray =
        this.createProgressButtons(progressStats);

      // Відправляємо повідомлення з детальною статистикою
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'detailedProgress',
        lang,
        dynamicVariables: {
          progressText,
          buttonsArray:
            JSON.stringify(buttonsArray)
        }
      });

      this.logger.log(
        `Detailed progress sent successfully for chat ${dto.chatId}`
      );
    } catch (error) {
      logError(
        'Error retrieving detailed progress',
        error,
        {
          customerId: customer?.id,
          chatId: dto.chatId
        }
      );

      // Відправляємо спрощену помилку
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang,
        dynamicVariables: {
          errorMessage:
            'Помилка отримання детального прогресу'
        }
      });
    }
  }

  /**
   * Форматування тексту детального прогресу
   */
  private formatProgressText(
    stats: UserProgressStats
  ): string {
    const {
      totalWords,
      learnedWords,
      wordsInProgress,
      wordsReadyForRepetition,
      wordsAddedToday,
      wordsAddedThisWeek,
      wordsAddedThisMonth,
      averageRepeatCount,
      repeatLevelStats,
      lastActivityDate,
      joinedDate
    } = stats;

    const progressPercentage =
      totalWords > 0
        ? Math.round(
            (learnedWords / totalWords) * 100
          )
        : 0;

    let progressText = `📊 **Мій детальний прогрес**\n\n`;

    // Основна статистика
    progressText += `📚 **Загальна статистика:**\n`;
    progressText += `• Всього слів: ${totalWords}\n`;
    progressText += `• Вивчено: ${learnedWords} (${progressPercentage}%)\n`;
    progressText += `• В процесі: ${wordsInProgress}\n`;
    progressText += `• Готові для повторення: ${wordsReadyForRepetition}\n\n`;

    // Активність по періодах
    progressText += `📈 **Активність:**\n`;
    progressText += `• Сьогодні додано: ${wordsAddedToday}\n`;
    progressText += `• Цього тижня: ${wordsAddedThisWeek}\n`;
    progressText += `• Цього місяця: ${wordsAddedThisMonth}\n\n`;

    // Статистика повторень
    progressText += `🔄 **Повторення:**\n`;
    progressText += `• Середня кількість повторень: ${averageRepeatCount}\n`;

    if (repeatLevelStats.length > 0) {
      progressText += `• По рівнях:\n`;
      repeatLevelStats.forEach(level => {
        if (level.count > 0) {
          progressText += `  - Рівень ${level.level} (${level.intervalDays}д): ${level.count} слів\n`;
        }
      });
    }

    // Часові метрики
    if (joinedDate) {
      const daysSinceJoined = Math.floor(
        (Date.now() - joinedDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      progressText += `\n⏰ **Часові показники:**\n`;
      progressText += `• Навчаюся ${daysSinceJoined} днів\n`;
    }

    if (lastActivityDate) {
      const lastActivityText = format(
        lastActivityDate,
        'dd.MM.yyyy HH:mm'
      );
      progressText += `• Остання активність: ${lastActivityText}\n`;
    }

    return progressText;
  }

  /**
   * Створення кнопок для детального прогресу
   */
  private createProgressButtons(
    stats: UserProgressStats
  ): InlineKeyboardButton[][] {
    const buttons: InlineKeyboardButton[][] = [];

    // Кнопка для перегляду слів готових для повторення
    if (stats.wordsReadyForRepetition > 0) {
      buttons.push([
        {
          text: `🔄 Повторити зараз (${stats.wordsReadyForRepetition})`,
          callback_data: COMMANDS.REPEAT_WORDS_NOW
        }
      ]);
    }

    // Кнопка для додавання нових слів
    buttons.push([
      {
        text: '➕ Додати нові слова',
        callback_data: COMMANDS.LEARN_WORDS
      }
    ]);

    // Кнопка для перегляду вивчених слів
    if (stats.learnedWords > 0) {
      buttons.push([
        {
          text: `📖 Переглянути вивчені (${stats.learnedWords})`,
          callback_data: '/viewLearnedWords'
        }
      ]);
    }

    // Кнопка головного меню
    buttons.push([
      {
        text: '🏠 Головне меню',
        callback_data: COMMANDS.MAIN_MENU
      }
    ]);

    return buttons;
  }

  // Метод createButtonsArray замінено на createProgressButtons для детальної статистики

  /**
   * Escape text for Markdown formatting
   */
  private escapeMarkdownText(
    text: string
  ): string {
    return text.replace(
      /[_*[\]()~`>#+\-=|{}.!]/g,
      '\\$&'
    );
  }
}
