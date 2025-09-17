import {
  Injectable,
  Inject,
  NotFoundException,
  Logger
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler
} from '@nestjs/cqrs';
import {
  UpdateWordRepetitionCommand,
  UpdateWordRepetitionResult
} from '../../commands/update-word-repetition.command';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma, Word } from '@prisma/client';
import { CacheInterface } from '../../../../cache/interfaces/cache.interface';

@Injectable()
@CommandHandler(UpdateWordRepetitionCommand)
export class UpdateWordRepetitionHandler
  implements
    ICommandHandler<
      UpdateWordRepetitionCommand,
      UpdateWordRepetitionResult
    >
{
  private readonly logger = new Logger(
    UpdateWordRepetitionHandler.name
  );

  // Інтервали повторення винесені в окрему константу для кращої підтримки (в днях)
  private readonly REPEAT_INTERVALS_DAYS = [
    1, 3, 7, 14, 30, 90
  ];

  constructor(
    private readonly prisma: PrismaService,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  async execute(
    command: UpdateWordRepetitionCommand
  ): Promise<UpdateWordRepetitionResult> {
    try {
      const { wordId, success } = command;

      const word =
        await this.prisma.word.findUnique({
          where: { id: wordId }
        });

      if (!word) {
        throw new NotFoundException(
          `Слово з ID ${wordId} не знайдено`
        );
      }

      const updates =
        this.calculateNextRepetition(
          word,
          success
        );

      const updatedWord =
        await this.prisma.word.update({
          where: { id: wordId },
          data: updates
        });

      this.logger.log(
        `Оновлено статус повторення для слова ${wordId}, success: ${success}. New nextRepeatDate: ${updatedWord.nextRepeatDate}`
      );

      await this.invalidateCache(word.customerId);

      return new UpdateWordRepetitionResult(
        updatedWord.id,
        updatedWord.repeatCount || 0,
        updatedWord.needToLearn
      );
    } catch (error) {
      this.logger.error(
        `Помилка при оновленні статусу повторення для слова ${command.wordId}:`,
        error
      );
      throw error;
    }
  }

  private calculateNextRepetition(
    word: Word,
    success: boolean
  ): Prisma.WordUpdateInput {
    const currentDate = new Date();
    let updates: Prisma.WordUpdateInput;

    if (success) {
      const currentRepeatCount =
        word.repeatCount || 0;
      const newRepeatCount =
        currentRepeatCount + 1;

      if (
        currentRepeatCount <
        this.REPEAT_INTERVALS_DAYS.length
      ) {
        const intervalDays =
          this.REPEAT_INTERVALS_DAYS[
            currentRepeatCount
          ];
        const nextRepetitionDate = new Date(
          currentDate
        );
        nextRepetitionDate.setDate(
          currentDate.getDate() + intervalDays
        );

        updates = {
          repeatCount: newRepeatCount,
          lastRepeatAt: currentDate,
          nextRepeatDate: nextRepetitionDate,
          needToLearn: true
        };
      } else {
        updates = {
          repeatCount: newRepeatCount,
          lastRepeatAt: currentDate,
          nextRepeatDate: null,
          needToLearn: false
        };
      }
    } else {
      const firstIntervalDays =
        this.REPEAT_INTERVALS_DAYS[0];
      const nextRepetitionDate = new Date(
        currentDate
      );
      nextRepetitionDate.setDate(
        currentDate.getDate() + firstIntervalDays
      );

      updates = {
        repeatCount: 0,
        lastRepeatAt: currentDate,
        nextRepeatDate: nextRepetitionDate,
        needToLearn: true
      };
    }
    return updates;
  }

  private async invalidateCache(
    customerId: number
  ): Promise<void> {
    const patternsToDelete = [
      `learned_words:${customerId}:*`,
      `words_for_repetition:customer:${customerId}`,
      `words_for_repetition:all`,
      `word_details:${customerId}:*`
    ];

    let totalDeletedCount = 0;
    for (const pattern of patternsToDelete) {
      try {
        const deletedCount =
          await this.cacheService.deleteByPattern(
            pattern
          );
        totalDeletedCount += deletedCount;
        this.logger.log(
          `Cache invalidated for pattern: ${pattern}. Deleted ${deletedCount} entries.`
        );
      } catch (error) {
        this.logger.error(
          `Error invalidating cache for pattern ${pattern}: ${error.message}`,
          error.stack
        );
      }
    }
    this.logger.log(
      `Total cache entries deleted for customer ${customerId}: ${totalDeletedCount}`
    );
  }
}
