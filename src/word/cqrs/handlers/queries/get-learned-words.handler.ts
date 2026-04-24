import {
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import {
  IQueryHandler,
  QueryHandler
} from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  GetLearnedWordsQuery,
  PaginatedWordsResult
} from '../../queries/get-learned-words.query';
import { CacheInterface } from '../../../../cache/interfaces/cache.interface';
import { Word } from '@prisma/client';

@Injectable()
@QueryHandler(GetLearnedWordsQuery)
export class GetLearnedWordsHandler
  implements
    IQueryHandler<
      GetLearnedWordsQuery,
      PaginatedWordsResult
    >
{
  private readonly logger = new Logger(
    GetLearnedWordsHandler.name
  );

  constructor(
    private readonly prisma: PrismaService,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  async execute(
    query: GetLearnedWordsQuery
  ): Promise<PaginatedWordsResult> {
    const { customerId, page, limit } = query;
    const cacheKey = `learned_words:${customerId}:${page}:${limit}`;

    return this.cacheService.getOrSet<PaginatedWordsResult>(
      cacheKey,
      async () => {
        this.logger.debug(
          `Cache miss for learned words: ${cacheKey}`
        );
        const skip = (page - 1) * limit;
        const wordsData =
          await this.prisma.word.findMany({
            where: {
              customerId,
              needToLearn: false
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              word: true,
              translation: true,
              examples: true,
              updatedAt: true
            }
          });

        const totalWords =
          await this.prisma.word.count({
            where: {
              customerId,
              needToLearn: false
            }
          });

        const words: Pick<
          Word,
          | 'id'
          | 'word'
          | 'translation'
          | 'examples'
          | 'updatedAt'
        >[] = wordsData;

        return {
          words,
          total: totalWords,
          pages: Math.ceil(totalWords / limit)
        };
      },
      60 * 5 // TTL 5 хвилин
    );
  }
}
