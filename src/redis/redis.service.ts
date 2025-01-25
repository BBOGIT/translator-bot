import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleInit, OnModuleDestroy
{
  private redisClient: Redis;

  constructor(
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    this.redisClient = new Redis({
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
      )
    });

    this.redisClient.on('error', error => {
      console.error('Redis error:', error);
    });

    this.redisClient.on('connect', () => {
      console.log(
        'Successfully connected to Redis'
      );
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

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

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
