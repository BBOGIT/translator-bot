import { Global, Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigService
} from '@nestjs/config';
import { MemoryCacheService } from './memory-cache.service';
import { RedisCacheService } from './redis-cache.service';
import { CacheMonitoringService } from './cache-monitoring.service';
import { RedisModule } from '../redis/redis.module';
import { CacheInterface } from './interfaces/cache.interface';

const cacheProvider = {
  provide: 'CACHE_SERVICE',
  useFactory: (
    configService: ConfigService,
    memoryCacheService: MemoryCacheService,
    redisCacheService: RedisCacheService
  ): CacheInterface => {
    const useRedis =
      configService.get<string>(
        'CACHE_PROVIDER',
        'memory'
      ) === 'redis';
    return useRedis
      ? redisCacheService
      : memoryCacheService;
  },
  inject: [
    ConfigService,
    MemoryCacheService,
    RedisCacheService
  ]
};

/**
 * Модуль для кешування даних
 */
@Global()
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [
    MemoryCacheService,
    RedisCacheService,
    CacheMonitoringService,
    cacheProvider
  ],
  exports: [
    'CACHE_SERVICE',
    CacheMonitoringService,
    RedisCacheService
  ]
})
export class CacheModule {}
