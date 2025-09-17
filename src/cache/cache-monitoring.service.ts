import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy
} from '@nestjs/common';

/**
 * Метрики кешування
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
}

/**
 * Сервіс для моніторингу ефективності кешування
 */
@Injectable()
export class CacheMonitoringService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    CacheMonitoringService.name
  );
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0
  };

  private monitoringInterval: NodeJS.Timeout | null =
    null;

  // Метрики для конкретних ключів кешу
  private keyMetrics: Map<
    string,
    { hits: number; misses: number }
  > = new Map();

  constructor() {
    // Конструктор тепер чистий від setInterval
  }

  onModuleInit() {
    const intervalMs = 10 * 60 * 1000; // 10 хвилин
    this.monitoringInterval = setInterval(() => {
      this.logCacheStats();
    }, intervalMs);
    this.logger.log(
      `Cache monitoring initiated. Stats will be logged every ${
        intervalMs / 60000
      } minutes.`
    );
  }

  onModuleDestroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.logger.log(
        'Cache monitoring stopped.'
      );
    }
  }

  /**
   * Скидаємо метрики
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0
    };
    this.keyMetrics.clear();
  }

  /**
   * Отримуємо поточні метрики
   */
  getMetrics(): CacheMetrics & {
    hitRate: number;
  } {
    const total =
      this.metrics.hits + this.metrics.misses;
    const hitRate =
      total > 0 ? this.metrics.hits / total : 0;
    return {
      ...this.metrics,
      hitRate
    };
  }

  /**
   * Реєструємо попадання в кеш
   */
  recordHit(key: string): void {
    this.metrics.hits++;
    const keyMetric = this.keyMetrics.get(
      key
    ) || { hits: 0, misses: 0 };
    keyMetric.hits++;
    this.keyMetrics.set(key, keyMetric);
  }

  /**
   * Реєструємо промах кешу
   */
  recordMiss(key: string): void {
    this.metrics.misses++;
    const keyMetric = this.keyMetrics.get(
      key
    ) || { hits: 0, misses: 0 };
    keyMetric.misses++;
    this.keyMetrics.set(key, keyMetric);
  }

  /**
   * Реєструємо збереження в кеш
   */
  recordSet(): void {
    this.metrics.sets++;
  }

  /**
   * Реєструємо видалення з кешу
   */
  recordDelete(): void {
    this.metrics.deletes++;
  }

  /**
   * Реєструємо очищення кешу
   */
  recordClear(): void {
    this.metrics.clears++;
  }

  /**
   * Отримати топ N найбільш кешованих ключів
   */
  getTopCacheKeys(n = 10): {
    key: string;
    hits: number;
    misses: number;
    hitRate: number;
  }[] {
    // Перетворюємо Map на масив об'єктів
    const keyMetricsArray = Array.from(
      this.keyMetrics.entries()
    ).map(([key, metrics]) => {
      const total = metrics.hits + metrics.misses;
      const hitRate =
        total > 0 ? metrics.hits / total : 0;
      return {
        key,
        hits: metrics.hits,
        misses: metrics.misses,
        hitRate
      };
    });

    // Сортуємо за кількістю попадань (найпопулярніші запити)
    return keyMetricsArray
      .sort((a, b) => b.hits - a.hits)
      .slice(0, n);
  }

  /**
   * Вивести моніторинг кешу в лог
   */
  logCacheStats(): void {
    const metrics = this.getMetrics();
    this.logger.log(
      `Cache stats - Hit rate: ${(
        metrics.hitRate * 100
      ).toFixed(2)}%, ` +
        `Hits: ${metrics.hits}, Misses: ${metrics.misses}, ` +
        `Sets: ${metrics.sets}, Deletes: ${metrics.deletes}, Clears: ${metrics.clears}`
    );

    const topKeys = this.getTopCacheKeys(5);
    if (topKeys.length > 0) {
      this.logger.log('Top 5 cached keys:');
      topKeys.forEach((keyMetric, index) => {
        this.logger.log(
          `${index + 1}. ${keyMetric.key} - ` +
            `Hit rate: ${(
              keyMetric.hitRate * 100
            ).toFixed(2)}%, ` +
            `Hits: ${keyMetric.hits}, Misses: ${keyMetric.misses}`
        );
      });
    }
  }
}
