// src/bot/bot.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { CustomerModule } from 'src/customer/customer.module';
import { MessageModule } from 'src/message/message.module';
import { WordModule } from 'src/word/word.module';
import { BotConfig } from './bot.config';
import { AiModule } from '../ai/ai.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    PrismaModule,
    RedisModule,
    JobsModule,
    CustomerModule,
    MessageModule,
    WordModule,
    AiModule,
    TelegramModule
  ],
  providers: [BotService, BotConfig],
  exports: [BotService]
})
export class BotModule {}
