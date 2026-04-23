import {
  NotFoundException,
  Injectable,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import {
  CommandBus,
  QueryBus
} from '@nestjs/cqrs';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  CreateWordDto,
  GetWordDto,
  UpdateWordRepetitionDto,
  TranslateWordResponseDto
} from './dto';
import { Prisma, Word } from '@prisma/client';

// Інтерфейс для детальної статистики користувача
export interface UserProgressStats {
  totalWords: number;
  learnedWords: number;
  wordsInProgress: number;
  wordsReadyForRepetition: number;
  wordsAddedToday: number;
  wordsAddedThisWeek: number;
  wordsAddedThisMonth: number;
  averageRepeatCount: number;
  repeatLevelStats: Array<{
    level: number;
    count: number;
    intervalDays: number;
  }>;
  lastActivityDate: Date | null;
  joinedDate: Date | null;
  longestStreak: number;
  currentStreak: number;
}

// Імпорт CQRS команд та запитів
import { CreateWordCommand } from './cqrs/commands/create-word.command';
import { UpdateWordRepetitionCommand } from './cqrs/commands/update-word-repetition.command';
import { UpdateWordNotificationCommand } from './cqrs/commands/update-word-notification.command';
import { GetWordQuery } from './cqrs/queries/get-word.query';
import {
  GetLearnedWordsQuery,
  PaginatedWordsResult
} from './cqrs/queries/get-learned-words.query';
import {
  GetWordsForRepetitionQuery,
  WordWithCustomer
} from './cqrs/queries/get-words-for-repetition.query';

@Injectable()
export class WordService {
  private readonly logger = new Logger(
    WordService.name
  );

  constructor(
    private prisma: PrismaService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private aiService: AiService
  ) {}

  async translate(
    text: string
  ): Promise<TranslateWordResponseDto> {
    const result = await this.aiService.processText(text);
    const examples = Array.isArray(result.examples)
      ? result.examples
      : result.examples
        ? [result.examples]
        : [];
    return { word: text, translation: result.translation, examples };
  }

  /**
   * Отримання списку вивчених слів з пагінацією
   */
  async getLearnedWordsWithPagination(
    customerId: number,
    page = 1,
    limit = 10
  ): Promise<PaginatedWordsResult> {
    return this.queryBus.execute(
      new GetLearnedWordsQuery(
        customerId,
        page,
        limit
      )
    );
  }

  /**
   * Отримання слова за словом та ID користувача
   */
  async getWord(dto: GetWordDto): Promise<Word> {
    try {
      const result = await this.queryBus.execute(
        new GetWordQuery(dto.word, dto.customerId)
      );
      return result.word;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(
        'Word not found'
      );
    }
  }

  /**
   * Отримання слова за ID
   */
  async getWordById(id: number): Promise<Word> {
    const word =
      await this.prisma.word.findUnique({
        where: { id }
      });
    if (!word) {
      throw new NotFoundException(
        `Word with ID ${id} not found`
      );
    }
    return word;
  }

  /**
   * Створення нового слова
   */
  public async createWord(
    dto: CreateWordDto
  ): Promise<Word> {
    try {
      const result =
        await this.commandBus.execute(
          new CreateWordCommand(
            dto.word,
            dto.translation,
            dto.customerId,
            dto.examples,
            dto.needToLearn,
            dto.videoExample,
            dto.imageExample
          )
        );

      return this.prisma.word.findUnique({
        where: { id: result.id }
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        `Error creating word: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Оновлення статусу повторення слова
   */
  public async updateWordRepetitionStatus(
    dto: UpdateWordRepetitionDto
  ): Promise<Word> {
    try {
      const result =
        await this.commandBus.execute(
          new UpdateWordRepetitionCommand(
            dto.wordId,
            dto.success
          )
        );

      return this.prisma.word.findUnique({
        where: { id: result.id }
      });
    } catch (error) {
      this.logger.error(
        `Error updating word repetition status: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Оновлення даних слова
   */
  public async updateWord(
    wordId: number,
    data: Prisma.WordUpdateInput
  ): Promise<Word> {
    const word =
      await this.prisma.word.findUnique({
        where: { id: wordId }
      });

    if (!word) {
      throw new NotFoundException(
        'Word not found'
      );
    }

    return await this.prisma.word.update({
      where: { id: wordId },
      data
    });
  }

  /**
   * Отримання слів за ID користувача та статусом вивчення
   */
  public async getWordsByCustomerId(
    customerId: number,
    needToLearn: boolean,
    pageSize?: number,
    offset?: number
  ): Promise<Word[]> {
    return await this.prisma.word.findMany({
      where: {
        customerId,
        needToLearn
      },
      take: pageSize,
      skip: offset
    });
  }

  /**
   * Отримання кількості слів користувача за статусом вівчення
   */
  public async getWordCount(
    customerId: number,
    needToLearn?: boolean
  ): Promise<number> {
    return await this.prisma.word.count({
      where: {
        customerId,
        ...(needToLearn !== undefined && { needToLearn })
      }
    });
  }

  /**
   * Отримання детальної статистики користувача
   */
  public async getUserProgressStats(
    customerId: number
  ): Promise<UserProgressStats> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekStart = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // Паралельно отримуємо базові статистики
    const [
      totalWords,
      learnedWords,
      wordsInProgress,
      wordsReadyForRepetition,
      wordsAddedToday,
      wordsAddedThisWeek,
      wordsAddedThisMonth,
      repeatStats,
      lastActivity,
      customer
    ] = await Promise.all([
      this.prisma.word.count({
        where: { customerId }
      }),
      this.prisma.word.count({
        where: { customerId, needToLearn: false }
      }),
      this.prisma.word.count({
        where: { customerId, needToLearn: true }
      }),
      this.prisma.word.count({
        where: {
          customerId,
          needToLearn: true,
          nextRepeatDate: { lte: now }
        }
      }),
      this.prisma.word.count({
        where: {
          customerId,
          createdAt: { gte: todayStart }
        }
      }),
      this.prisma.word.count({
        where: {
          customerId,
          createdAt: { gte: weekStart }
        }
      }),
      this.prisma.word.count({
        where: {
          customerId,
          createdAt: { gte: monthStart }
        }
      }),
      this.prisma.word.aggregate({
        where: { customerId },
        _avg: { repeatCount: true }
      }),
      this.prisma.word.findFirst({
        where: { customerId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      this.prisma.customer.findUnique({
        where: { id: customerId },
        select: { createdAt: true }
      })
    ]);

    // Статистика по рівнях повторення
    const REPEAT_INTERVALS_DAYS = [
      1, 3, 7, 14, 30, 90
    ];

    const repeatLevelStats = await Promise.all(
      REPEAT_INTERVALS_DAYS.map(
        async (intervalDays, index) => {
          const count =
            await this.prisma.word.count({
              where: {
                customerId,
                needToLearn: true,
                repeatCount: index
              }
            });
          return {
            level: index + 1,
            count,
            intervalDays
          };
        }
      )
    );

    return {
      totalWords,
      learnedWords,
      wordsInProgress,
      wordsReadyForRepetition,
      wordsAddedToday,
      wordsAddedThisWeek,
      wordsAddedThisMonth,
      averageRepeatCount: Math.round(
        repeatStats._avg.repeatCount || 0
      ),
      repeatLevelStats,
      lastActivityDate:
        lastActivity?.updatedAt || null,
      joinedDate: customer?.createdAt || null,
      longestStreak: 0, // Спрощено для початку
      currentStreak: 0 // Спрощено для початку
    };
  }

  /**
   * Отримання слів для повторення
   */
  public async getWordsForRepetition(
    customerId?: number
  ): Promise<WordWithCustomer[]> {
    const result = await this.queryBus.execute(
      new GetWordsForRepetitionQuery(customerId)
    );
    return result.words;
  }

  /**
   * Отримання наступного/попереднього слова для повторення
   */
  public async getNextWordForRepetition(
    customerId: number,
    currentWordId: number,
    direction: 'next' | 'previous'
  ): Promise<Word | null> {
    // Отримуємо всі слова для повторення
    const words =
      await this.getWordsForRepetition(
        customerId
      );

    if (words.length === 0) {
      return null;
    }

    // Знаходимо індекс поточного слова
    const currentIndex = words.findIndex(
      word => word.id === currentWordId
    );

    if (currentIndex === -1) {
      // Якщо поточне слово не знайдено, повертаємо перше
      return words[0];
    }

    let targetIndex: number;
    if (direction === 'next') {
      targetIndex = currentIndex + 1;
      // Якщо досягли кінця, повертаємося на початок
      if (targetIndex >= words.length) {
        targetIndex = 0;
      }
    } else {
      targetIndex = currentIndex - 1;
      // Якщо досягли початку, переходимо в кінець
      if (targetIndex < 0) {
        targetIndex = words.length - 1;
      }
    }

    return words[targetIndex];
  }

  /**
   * Оновлення часу останнього сповіщення про слово
   */
  public async updateWordNotification(
    wordId: number
  ): Promise<Word> {
    try {
      const result =
        await this.commandBus.execute(
          new UpdateWordNotificationCommand(
            wordId
          )
        );

      return this.prisma.word.findUnique({
        where: { id: result.id }
      });
    } catch (error) {
      this.logger.error(
        `Error updating word notification time: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
