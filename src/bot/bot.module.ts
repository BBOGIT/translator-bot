import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CustomerService } from 'src/customer/customer.service';
import { MessageService } from 'src/message/message.service';
import { RedisModule } from '../redis/redis.module';
import { WordService } from 'src/word/word.service';
import { BotConfig } from './bot.config';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    BotService,
    CustomerService,
    MessageService,
    WordService,
    BotConfig
  ],
  exports: [BotService]
})
export class BotModule {}