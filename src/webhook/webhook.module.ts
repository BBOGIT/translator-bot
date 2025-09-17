import {
  Module,
  forwardRef
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BotModule } from '../bot/bot.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    forwardRef(() => BotModule)
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService]
})
export class WebhookModule {}
