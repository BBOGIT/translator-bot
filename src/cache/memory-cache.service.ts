import {
  Injectable,
  Logger
} from '@nestjs/common';
import { CacheMonitoringService } from './cache-monitoring.service';
import { CacheInterface } from './interfaces/cache.interface';

/**
 * TTL значення за замовчуванням - 1 година (в секундах)
 */
const DEFAULT_TTL_SECONDS = 60 * 60;

/**
 * Структура кеш-записів
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * In-memory кеш-сервіс
 */
@Injectable()
export class MemoryCacheService
  implements CacheInterface
{
  private readonly logger = new Logger(
    MemoryCacheService.name
  );
  private cache = new Map<
    string,
    CacheEntry<unknown>
  >();

  constructor(
    private readonly monitoringService: CacheMonitoringService
  ) {
    // Логуємо статистику кешу кожні 10 хвилин - ВИДАЛЕНО
    // setInterval(() => {
    //   this.monitoringService.logCacheStats();
    // }, 10 * 60 * 1000);
  }

  /**
   * Отримати дані з кешу
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    // Немає запису в кеші
    if (!entry) {
      this.monitoringService.recordMiss(key);
      return null;
    }

    // Запис існує, але протермінований
    if (entry.expiresAt < Date.now()) {
      this.logger.debug(
        `Cache expired for key: ${key}`
      );
      this.cache.delete(key);
      this.monitoringService.recordMiss(key);
      return null;
    }

    // Кеш-хіт
    this.monitoringService.recordHit(key);
    return entry.data as T;
  }

  /**
   * Зберегти дані в кеш
   */
  async set<T>(
    key: string,
    data: T,
    ttlInSeconds: number = DEFAULT_TTL_SECONDS // Очікуємо TTL в секундах
  ): Promise<void> {
    const ttlInMilliseconds = ttlInSeconds * 1000;
    const expiresAt =
      Date.now() + ttlInMilliseconds;
    this.cache.set(key, { data, expiresAt });
    this.monitoringService.recordSet();
  }

  /**
   * Видалити запис з кешу
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.monitoringService.recordDelete();
  }

  /**
   * Видалити записи з кешу за шаблоном ключа
   */
  async deleteByPattern(
    pattern: string
  ): Promise<number> {
    const regex = new RegExp(pattern);
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(
        `Deleted ${deletedCount} cache entries matching pattern: ${pattern}`
      );
      this.monitoringService.recordDelete();
    }

    return deletedCount;
  }

  /**
   * Очистити весь кеш
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.monitoringService.recordClear();
  }

  /**
   * Повернути значення з кешу або викликати функцію, якщо кеш відсутній
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlInSeconds: number = DEFAULT_TTL_SECONDS // Очікуємо TTL в секундах
  ): Promise<T> {
    const cachedData = await this.get<T>(key);

    if (cachedData !== null) {
      return cachedData;
    }

    try {
      const data = await fetchFn();
      // Викликаємо наш оновлений set, який очікує секунди
      await this.set(key, data, ttlInSeconds);
      return data;
    } catch (error) {
      this.logger.error(
        `Error fetching data for cache key ${key}: ${error.message}`
      );
      throw error;
    }
  }
}
