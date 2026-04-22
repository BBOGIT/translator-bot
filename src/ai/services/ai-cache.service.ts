import {
  Injectable,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { RedisCacheService } from '../../cache/redis-cache.service';
import { AICacheInterface } from '../interfaces/ai-cache.interface';
import { AIResponse } from '../interfaces/ai-response.interface';

/**
 * Сервіс для кешування AI відповідей в Redis
 *
 * Основні функції:
 * - Кешування перекладів тексту
 * - Кешування обробки зображень
 * - Кешування regex паттернів для каналів
 * - Інтелектуальне формування ключів кешу
 */
@Injectable()
export class AICacheService
  implements AICacheInterface
{
  private readonly logger = new Logger(
    AICacheService.name
  );

  // Префікси для різних типів кешу
  private readonly CACHE_PREFIXES = {
    TEXT: 'ai:text:',
    IMAGE: 'ai:image:',
    REGEX: 'ai:regex:'
  } as const;

  // TTL значення за замовчуванням (в секундах)
  private readonly DEFAULT_TTL = {
    TEXT: 60 * 60 * 24 * 7, // 7 днів для текстових перекладів
    IMAGE: 60 * 60 * 24 * 3, // 3 дні для зображень
    REGEX: 60 * 60 * 24 * 30 // 30 днів для regex паттернів
  } as const;

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Створює хеш для тексту - використовується як ключ кешу
   * SHA-256 забезпечує унікальність та безпеку
   */
  private createTextHash(text: string): string {
    return createHash('sha256')
      .update(text.toLowerCase().trim())
      .digest('hex')
      .substring(0, 16); // Перші 16 символів достатньо для унікальності
  }

  /**
   * Створює хеш для binary даних (зображень)
   */
  private createImageHash(
    imageBuffer: Buffer
  ): string {
    return createHash('sha256')
      .update(imageBuffer)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Формує ключ кешу для тексту
   */
  private getTextCacheKey(
    text: string,
    provider: string
  ): string {
    const textHash = this.createTextHash(text);
    return `${this.CACHE_PREFIXES.TEXT}${provider}:${textHash}`;
  }

  /**
   * Формує ключ кешу для зображень
   */
  private getImageCacheKey(
    imageHash: string,
    provider: string
  ): string {
    return `${this.CACHE_PREFIXES.IMAGE}${provider}:${imageHash}`;
  }

  /**
   * Формує ключ кешу для regex паттернів
   */
  private getRegexCacheKey(
    content: string,
    channelId: string,
    provider: string
  ): string {
    const contentHash =
      this.createTextHash(content);
    return `${this.CACHE_PREFIXES.REGEX}${provider}:${channelId}:${contentHash}`;
  }

  /**
   * Отримати кешовану відповідь для текстового запиту
   */
  async getTextResponse(
    text: string,
    provider: string
  ): Promise<AIResponse | null> {
    try {
      const key = this.getTextCacheKey(
        text,
        provider
      );
      const cachedResponse =
        await this.cacheService.get<AIResponse>(
          key
        );

      if (cachedResponse) {
        this.logger.debug(
          `Cache hit for text translation: ${text.substring(0, 50)}...`
        );
      }

      return cachedResponse;
    } catch (error) {
      this.logger.error(
        `Error getting cached text response: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Зберегти відповідь для текстового запиту в кеш
   */
  async setTextResponse(
    text: string,
    provider: string,
    response: AIResponse,
    ttl?: number
  ): Promise<void> {
    try {
      const key = this.getTextCacheKey(
        text,
        provider
      );
      const cacheTtl =
        ttl || this.DEFAULT_TTL.TEXT;

      await this.cacheService.set(
        key,
        response,
        cacheTtl
      );

      this.logger.debug(
        `Cached text response for: ${text.substring(0, 50)}... (TTL: ${cacheTtl}s)`
      );
    } catch (error) {
      this.logger.error(
        `Error caching text response: ${error.message}`
      );
    }
  }

  /**
   * Отримати кешовану відповідь для зображення
   */
  async getImageResponse(
    imageHash: string,
    provider: string
  ): Promise<AIResponse | null> {
    try {
      const key = this.getImageCacheKey(
        imageHash,
        provider
      );
      const cachedResponse =
        await this.cacheService.get<AIResponse>(
          key
        );

      if (cachedResponse) {
        this.logger.debug(
          `Cache hit for image processing: ${imageHash}`
        );
      }

      return cachedResponse;
    } catch (error) {
      this.logger.error(
        `Error getting cached image response: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Зберегти відповідь для зображення в кеш
   */
  async setImageResponse(
    imageHash: string,
    provider: string,
    response: AIResponse,
    ttl?: number
  ): Promise<void> {
    try {
      const key = this.getImageCacheKey(
        imageHash,
        provider
      );
      const cacheTtl =
        ttl || this.DEFAULT_TTL.IMAGE;

      await this.cacheService.set(
        key,
        response,
        cacheTtl
      );

      this.logger.debug(
        `Cached image response for: ${imageHash} (TTL: ${cacheTtl}s)`
      );
    } catch (error) {
      this.logger.error(
        `Error caching image response: ${error.message}`
      );
    }
  }

  /**
   * Отримати кешовані regex паттерни для каналу
   */
  async getRegexPatterns(
    content: string,
    channelId: string,
    provider: string
  ): Promise<{
    wordRegex: string;
    translationRegex: string;
    examplesRegex: string;
    confidence: number;
  } | null> {
    try {
      const key = this.getRegexCacheKey(
        content,
        channelId,
        provider
      );
      const cachedPatterns =
        await this.cacheService.get<{
          wordRegex: string;
          translationRegex: string;
          examplesRegex: string;
          confidence: number;
        }>(key);

      if (cachedPatterns) {
        this.logger.debug(
          `Cache hit for regex patterns: ${channelId}`
        );
      }

      return cachedPatterns;
    } catch (error) {
      this.logger.error(
        `Error getting cached regex patterns: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Зберегти regex паттерни в кеш
   */
  async setRegexPatterns(
    content: string,
    channelId: string,
    provider: string,
    patterns: {
      wordRegex: string;
      translationRegex: string;
      examplesRegex: string;
      confidence: number;
    },
    ttl?: number
  ): Promise<void> {
    try {
      const key = this.getRegexCacheKey(
        content,
        channelId,
        provider
      );
      const cacheTtl =
        ttl || this.DEFAULT_TTL.REGEX;

      await this.cacheService.set(
        key,
        patterns,
        cacheTtl
      );

      this.logger.debug(
        `Cached regex patterns for channel: ${channelId} (TTL: ${cacheTtl}s)`
      );
    } catch (error) {
      this.logger.error(
        `Error caching regex patterns: ${error.message}`
      );
    }
  }

  /**
   * Очистити кеш для конкретного провайдера
   */
  async clearProviderCache(
    provider: string
  ): Promise<void> {
    try {
      const patterns = [
        `${this.CACHE_PREFIXES.TEXT}${provider}:*`,
        `${this.CACHE_PREFIXES.IMAGE}${provider}:*`,
        `${this.CACHE_PREFIXES.REGEX}${provider}:*`
      ];

      for (const pattern of patterns) {
        await this.cacheService.deleteByPattern(
          pattern
        );
      }

      this.logger.log(
        `Cleared cache for provider: ${provider}`
      );
    } catch (error) {
      this.logger.error(
        `Error clearing provider cache for ${provider}: ${error.message}`
      );
    }
  }

  /**
   * Очистити весь AI кеш
   */
  async clearAll(): Promise<void> {
    try {
      const patterns = Object.values(
        this.CACHE_PREFIXES
      ).map(prefix => `${prefix}*`);

      for (const pattern of patterns) {
        await this.cacheService.deleteByPattern(
          pattern
        );
      }

      this.logger.log('Cleared all AI cache');
    } catch (error) {
      this.logger.error(
        `Error clearing all AI cache: ${error.message}`
      );
    }
  }

  /**
   * Допоміжний метод для створення хешу зображення з Buffer
   */
  createImageHashFromBuffer(
    imageBuffer: Buffer
  ): string {
    return this.createImageHash(imageBuffer);
  }

  /**
   * Отримати статистику використання кешу
   */
  async getCacheStats(): Promise<{
    textCacheKeys: number;
    imageCacheKeys: number;
    regexCacheKeys: number;
  }> {
    try {
      // Підрахунок кількості ключів для кожного типу кешу
      // (у реальному проекті можна оптимізувати за допомогою Redis SCAN)
      const [textKeys, imageKeys, regexKeys] =
        await Promise.all([
          this.cacheService.deleteByPattern(
            `${this.CACHE_PREFIXES.TEXT}*`
          ),
          this.cacheService.deleteByPattern(
            `${this.CACHE_PREFIXES.IMAGE}*`
          ),
          this.cacheService.deleteByPattern(
            `${this.CACHE_PREFIXES.REGEX}*`
          )
        ]);

      return {
        textCacheKeys: textKeys,
        imageCacheKeys: imageKeys,
        regexCacheKeys: regexKeys
      };
    } catch (error) {
      this.logger.error(
        `Error getting cache stats: ${error.message}`
      );
      return {
        textCacheKeys: 0,
        imageCacheKeys: 0,
        regexCacheKeys: 0
      };
    }
  }
}
