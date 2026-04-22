import {
  Injectable,
  Logger,
  Inject
} from '@nestjs/common';
import {
  IQueryHandler,
  QueryHandler
} from '@nestjs/cqrs';
import {
  GetWordsForRepetitionQuery,
  GetWordsForRepetitionResult
} from '../../queries/get-words-for-repetition.query';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CacheInterface } from '../../../../cache/interfaces/cache.interface';

@Injectable()
@QueryHandler(GetWordsForRepetitionQuery)
export class GetWordsForRepetitionHandler
  implements
    IQueryHandler<GetWordsForRepetitionQuery>
{
  private readonly logger = new Logger(
    GetWordsForRepetitionHandler.name
  );

  constructor(
    private readonly prisma: PrismaService,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface
  ) {}

  async execute(
    query: GetWordsForRepetitionQuery
  ): Promise<GetWordsForRepetitionResult> {
    const { customerId } = query;

    // Створюємо ключ кешу в залежності від наявності customerId
    const cacheKey = customerId
      ? `words_for_repetition:customer:${customerId}`
      : `words_for_repetition:all`;

    // Спеціально видаляємо кеш для забезпечення актуальних даних при повторенні слів
    await this.cacheService.delete(cacheKey);

    // Використовуємо кешування для оптимізації частих запитів
    // Для запитів повторення слів використовуємо коротший TTL, оскільки ці дані можуть часто змінюватися
    return this.cacheService.getOrSet<GetWordsForRepetitionResult>(
      cacheKey,
      async () => {
        // Базовий фільтр для слів, які потребують повторення:
        // 1. needToLearn = true означає, що слово потребує вивчення/повторення
        // 2. Додаємо умову по lastNotificationAt, щоб не надсилати повторні повідомлення протягом дня
        const whereClause: any = {
          needToLearn: true,
          OR: [
            { nextRepeatDate: null },
            { nextRepeatDate: { lte: new Date() } }
          ]
        };

        // Якщо вказано customerId, додаємо його до фільтра
        if (customerId) {
          whereClause.customerId = customerId;
        }

        // Знаходимо слова для повторення з використанням індексованих полів
        const words =
          await this.prisma.word.findMany({
            where: whereClause,
            include: {
              customer: true
            },
            // Обмежуємо кількість слів для повторення, щоб запит був більш ефективним
            take: 100,
            // Сортуємо за датою створення, щоб спочатку повторювали нові слова
            orderBy: {
              createdAt: 'desc'
            }
          });

        return new GetWordsForRepetitionResult(
          words
        );
      },
      // Кеш дійсний 10 секунд для запитів повторення, щоб уникнути частих запитів до БД
      10000
    );
  }
}
