import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleInit, OnModuleDestroy
{
  private redisClient: Redis;
  private readonly logger = new Logger(
    RedisService.name
  );

  constructor(
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    const maxRetries = 5;
    const redisOptions: RedisOptions = {
      host: this.configService.get<string>(
        'REDIS_HOST',
        'localhost'
      ),
      port: this.configService.get<number>(
        'REDIS_PORT',
        6379
      ),
      password: this.configService.get<string>(
        'REDIS_PASSWORD'
      ),
      db: this.configService.get<number>(
        'REDIS_DB',
        0
      ),
      retryStrategy: times => {
        if (times > maxRetries) {
          this.logger.error(
            `Exhausted Redis connection retries (${maxRetries}).`
          );
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(
          `Retrying Redis connection (attempt ${times}), delay ${delay}ms`
        );
        return delay;
      },
      maxRetriesPerRequest: 3
    };
    this.redisClient = new Redis(redisOptions);

    await new Promise<void>((resolve, reject) => {
      const connectHandler = () => {
        this.logger.log(
          'Successfully connected to Redis'
        );
        this.redisClient.removeListener(
          'error',
          errorHandler
        );
        resolve();
      };

      const errorHandler = err => {
        const errorMessage = `Failed to connect to Redis after ${maxRetries} retries.`;
        this.logger.error(
          errorMessage,
          err.message
        );
        this.redisClient.removeListener(
          'connect',
          connectHandler
        );
        reject(new Error(errorMessage));
      };

      this.redisClient.once(
        'connect',
        connectHandler
      );
      this.redisClient.once(
        'error',
        errorHandler
      );
    });

    this.redisClient.on('error', error => {
      this.logger.error('Redis error:', error);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  /**
   * Отримує екземпляр клієнта Redis
   */
  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * Встановлює значення за ключем
   * @param key Ключ
   * @param value Значення
   * @param expireTime Час життя в секундах
   */
  async set(
    key: string,
    value: string,
    expireTime?: number
  ): Promise<void> {
    if (expireTime) {
      await this.redisClient.set(
        key,
        value,
        'EX',
        expireTime
      );
    } else {
      await this.redisClient.set(key, value);
    }
  }

  /**
   * Отримує значення за ключем
   * @param key Ключ
   */
  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  /**
   * Видаляє значення за ключем
   * @param key Ключ
   */
  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Знаходить ключі за шаблоном
   * @param pattern Шаблон (наприклад, user:*)
   */
  async keys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const stream = this.redisClient.scanStream({
        match: pattern,
        count: 100
      });
      const keys: string[] = [];
      stream.on(
        'data',
        (resultKeys: string[]) => {
          keys.push(...resultKeys);
        }
      );
      stream.on('end', () => {
        resolve(keys);
      });
      stream.on('error', err => {
        this.logger.error(
          `Error scanning keys with pattern ${pattern}:`,
          err
        );
        reject(err);
      });
    });
  }

  /**
   * Створює pipeline для групування команд
   */
  pipeline() {
    return this.redisClient.pipeline();
  }

  /**
   * Встановлює значення з автоматичним закінченням терміну дії
   * @param key Ключ
   * @param value Значення
   * @param ttl Час життя в секундах
   */
  async setex(
    key: string,
    ttl: number,
    value: string
  ): Promise<string> {
    return await this.redisClient.setex(
      key,
      ttl,
      value
    );
  }

  /**
   * Додає значення до списку
   * @param key Ключ
   * @param values Значення
   */
  async lpush(
    key: string,
    ...values: string[]
  ): Promise<number> {
    return await this.redisClient.lpush(
      key,
      ...values
    );
  }

  /**
   * Отримує всі елементи списку
   * @param key Ключ
   */
  async lrange(
    key: string,
    start: number,
    stop: number
  ): Promise<string[]> {
    return await this.redisClient.lrange(
      key,
      start,
      stop
    );
  }

  /**
   * Перевіряє існування ключа
   * @param key Ключ
   */
  async exists(key: string): Promise<number> {
    return await this.redisClient.exists(key);
  }
}
