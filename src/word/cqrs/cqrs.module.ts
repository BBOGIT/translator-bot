import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  CommandHandlers,
  QueryHandlers
} from './handlers';
import { CacheModule } from '../../cache/cache.module';

/**
 * Модуль для CQRS (Command Query Responsibility Segregation)
 *
 * Цей модуль відповідає за реєстрацію всіх обробників команд та запитів
 * й надає доступ до них через CqrsModule.
 * Також використовує CacheModule для оптимізації запитів.
 */
@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    CacheModule
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [CqrsModule]
})
export class WordCqrsModule {}
