// src/bot/bot.module.ts
import {
  Module,
  forwardRef
} from '@nestjs/common';
import { BotService } from './bot.service';
import { CustomerModule } from '../customer/customer.module';
import { WebhookModule } from '../webhook/webhook.module';
import { MessageModule } from '../message/message.module';
import { TelegramModule } from '../telegram/telegram.module';
import { WordModule } from '../word/word.module';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { BotTestController } from './controllers/bot-test.controller';
import { StaticController } from './controllers/static.controller';
import { HandlersModule } from './handlers/handlers.module';
import { StrategiesModule } from './strategies/strategies.module';
import { RedisModule } from '../redis/redis.module';
import { BotConfig } from './bot.config';

@Module({
  imports: [
    CustomerModule,
    MessageModule,
    WordModule,
    JobsModule,
    AiModule,
    TelegramModule,
    RedisModule,
    forwardRef(() => WebhookModule),
    HandlersModule,
    StrategiesModule
  ],
  controllers: [
    BotTestController,
    StaticController
  ],
  providers: [BotService, BotConfig],
  exports: [BotService]
})
export class BotModule {}
