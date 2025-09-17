import {
  Injectable,
  Logger
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CacheMonitoringService } from './cache-monitoring.service';
import { ConfigService } from '@nestjs/config';
import { CacheInterface } from './interfaces/cache.interface';

/**
 * TTL значення за замовчуванням - 1 година
 */
const DEFAULT_TTL = 60 * 60;

/**
 * Сервіс для кешування даних з використанням Redis
 */
@Injectable()
export class RedisCacheService
  implements CacheInterface
{
  private readonly logger = new Logger(
    RedisCacheService.name
  );
  private readonly keyPrefix: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly monitoringService: CacheMonitoringService
  ) {
    this.keyPrefix =
      this.configService.get<string>(
        'REDIS_KEY_PREFIX',
        'translator:'
      );
  }

  /**
   * Формуємо повний ключ з префіксом
   */
  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Отримати дані з кешу
   * @param key Ключ кешу
   * @returns Дані або null, якщо дані відсутні або застарілі
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key);
      const data =
        await this.redisService.get(fullKey);

      if (!data) {
        this.monitoringService.recordMiss(key);
        return null;
      }

      this.monitoringService.recordHit(key);
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(
        `Error getting cache for key ${key}: ${error.message}`
      );
      this.monitoringService.recordMiss(key);
      return null;
    }
  }

  /**
   * Зберегти дані в кеш
   * @param key Ключ кешу
   * @param data Дані для збереження
   * @param ttl Час життя в секундах
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.redisService.set(
        fullKey,
        JSON.stringify(data),
        ttl
      );
      this.monitoringService.recordSet();
    } catch (error) {
      this.logger.error(
        `Error setting cache for key ${key}: ${error.message}`
      );
    }
  }

  /**
   * Видалити запис з кешу
   * @param key Ключ кешу
   */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.redisService.del(fullKey);
      this.monitoringService.recordDelete();
    } catch (error) {
      this.logger.error(
        `Error deleting cache for key ${key}: ${error.message}`
      );
    }
  }

  /**
   * Видалити записи з кешу за шаблоном ключа
   * @param pattern Шаблон ключа (наприклад, user:*)
   */
  async deleteByPattern(
    pattern: string
  ): Promise<number> {
    try {
      const fullPattern =
        this.getFullKey(pattern);
      const keys =
        await this.redisService.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      const pipeline =
        this.redisService.pipeline();
      keys.forEach(key => pipeline.del(key));

      await pipeline.exec();

      this.logger.debug(
        `Deleted ${keys.length} cache entries matching pattern: ${pattern}`
      );
      this.monitoringService.recordDelete();

      return keys.length;
    } catch (error) {
      this.logger.error(
        `Error deleting cache by pattern ${pattern}: ${error.message}`
      );
      return 0;
    }
  }

  /**
   * Очистити весь кеш
   */
  async clear(): Promise<void> {
    try {
      // Видаляємо всі ключі з поточним префіксом
      await this.deleteByPattern('*');
      this.monitoringService.recordClear();
    } catch (error) {
      this.logger.error(
        `Error clearing cache: ${error.message}`
      );
    }
  }

  /**
   * Повернути значення з кешу або викликати функцію, якщо кеш відсутній
   * @param key Ключ кешу
   * @param fetchFn Функція для отримання даних
   * @param ttl Час життя в секундах
   * @returns Результат виконання функції
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = DEFAULT_TTL
  ): Promise<T> {
    const cachedData = await this.get<T>(key);

    if (cachedData !== null) {
      return cachedData;
    }

    try {
      const data = await fetchFn();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      this.logger.error(
        `Error fetching data for cache key ${key}: ${error.message}`
      );
      throw error;
    }
  }
}
