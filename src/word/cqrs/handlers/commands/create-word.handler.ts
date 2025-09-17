import {
  Injectable,
  ForbiddenException,
  Logger,
  Inject
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler
} from '@nestjs/cqrs';
import {
  CreateWordCommand,
  CreateWordResult
} from '../../commands/create-word.command';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CacheInterface } from '../../../../cache/interfaces/cache.interface';

@Injectable()
@CommandHandler(CreateWordCommand)
export class CreateWordHandler
  implements ICommandHandler<CreateWordCommand>
{
  private readonly logger = new Logger(
    CreateWordHandler.name
  );

  constructor(
    private readonly prisma: PrismaService,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  async execute(
    command: CreateWordCommand
  ): Promise<CreateWordResult> {
    try {
      const {
        word,
        translation,
        customerId,
        examples,
        needToLearn,
        videoExample,
        imageExample
      } = command;

      // Перетворення examples на string, якщо це масив
      const formattedExamples =
        examples && Array.isArray(examples)
          ? JSON.stringify(examples)
          : (examples as string);

      // Перевірка на валідність videoExample
      let finalVideoExample = videoExample;
      if (
        finalVideoExample === 'null' ||
        finalVideoExample === '' ||
        (finalVideoExample &&
          finalVideoExample.trim() === '')
      ) {
        this.logger.log(
          `Виявлено невалідний videoExample. Встановлюємо null.`
        );
        finalVideoExample = null;
      }

      // Створення слова в базі даних
      const createdWord =
        await this.prisma.word.create({
          data: {
            word,
            translation,
            customerId,
            needToLearn: needToLearn ?? true,
            videoExample: finalVideoExample,
            imageExample: imageExample ?? null,
            examples: formattedExamples
          }
        });

      this.logger.log(
        `Слово "${word}" створено для користувача ${customerId}`
      );

      await this.invalidateCache(customerId);

      return new CreateWordResult(
        createdWord.id,
        createdWord.word,
        createdWord.translation,
        createdWord.customerId
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException(
          'Word already exists'
        );
      }
      throw error;
    }
  }

  /**
   * Інвалідуємо кеш для слів користувача
   */
  private async invalidateCache(
    customerId: number
  ): Promise<void> {
    const patternsToDelete = [
      `learned_words:${customerId}:*`,
      `words_for_repetition:customer:${customerId}`,
      `words_for_repetition:all`
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
