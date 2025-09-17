import { Module } from '@nestjs/common';
import { WordService } from './word.service';
import { WordController } from './word.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WordCqrsModule } from './cqrs/cqrs.module';
import { CacheModule } from '../cache/cache.module';

/**
 * Модуль для роботи зі словами
 *
 * Використовує WordCqrsModule для реалізації патерну CQRS
 * та CacheModule для оптимізації запитів
 */
@Module({
  imports: [
    PrismaModule,
    WordCqrsModule,
    CacheModule
  ],
  providers: [WordService],
  exports: [WordService],
  controllers: [WordController]
})
export class WordModule {}
