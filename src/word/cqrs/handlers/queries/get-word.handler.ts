import {
  Injectable,
  NotFoundException,
  Inject
} from '@nestjs/common';
import {
  IQueryHandler,
  QueryHandler
} from '@nestjs/cqrs';
import {
  GetWordQuery,
  GetWordResult
} from '../../queries/get-word.query';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CacheInterface } from '../../../../cache/interfaces/cache.interface';

@Injectable()
@QueryHandler(GetWordQuery)
export class GetWordHandler
  implements IQueryHandler<GetWordQuery>
{
  constructor(
    private readonly prisma: PrismaService,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  async execute(
    query: GetWordQuery
  ): Promise<GetWordResult> {
    const { word, customerId } = query;
    const cacheKey = `word:${customerId}:${word}`;

    // Використовуємо кешування для отримання конкретного слова
    return this.cacheService.getOrSet<GetWordResult>(
      cacheKey,
      async () => {
        const foundWord =
          await this.prisma.word.findUnique({
            where: {
              customerId_word: {
                customerId,
                word
              }
            }
          });

        if (!foundWord) {
          throw new NotFoundException(
            'Word not found'
          );
        }

        return new GetWordResult(foundWord);
      },
      // Кеш дійсний 10 хвилин, так як слова не змінюються часто
      600
    );
  }
}
