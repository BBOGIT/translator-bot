import {
  Injectable,
  NotFoundException,
  Logger,
  Inject
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler
} from '@nestjs/cqrs';
import {
  UpdateWordNotificationCommand,
  UpdateWordNotificationResult
} from '../../commands/update-word-notification.command';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CacheInterface } from '../../../../cache/interfaces/cache.interface';

@Injectable()
@CommandHandler(UpdateWordNotificationCommand)
export class UpdateWordNotificationHandler
  implements
    ICommandHandler<
      UpdateWordNotificationCommand,
      UpdateWordNotificationResult
    >
{
  private readonly logger = new Logger(
    UpdateWordNotificationHandler.name
  );

  constructor(
    private readonly prisma: PrismaService,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  async execute(
    command: UpdateWordNotificationCommand
  ): Promise<UpdateWordNotificationResult> {
    const { wordId } = command;
    const now = new Date();

    const word =
      await this.prisma.word.findUnique({
        where: { id: wordId }
      });

    if (!word) {
      throw new NotFoundException(
        `Word with id ${wordId} not found`
      );
    }

    const updatedWord =
      await this.prisma.word.update({
        where: { id: wordId },
        data: { lastNotificationAt: now }
      });

    this.logger.log(
      `Notification time updated for word ${wordId} for customer ${word.customerId}`
    );

    await this.invalidateCache(word.customerId);

    return new UpdateWordNotificationResult(
      updatedWord.id,
      updatedWord.lastNotificationAt!
    );
  }

  /**
   * Інвалідуємо кеш, пов'язаний зі словом
   */
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
