import { Module } from '@nestjs/common';
import { WordService } from './word.service';
import { WordController } from './word.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WordCqrsModule } from './cqrs/cqrs.module';
import { CacheModule } from '../cache/cache.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    WordCqrsModule,
    CacheModule,
    AiModule
  ],
  providers: [WordService],
  exports: [WordService],
  controllers: [WordController]
})
export class WordModule {}
