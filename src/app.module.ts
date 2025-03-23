import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { WordModule } from './word/word.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { WebhookModule } from './webhook/webhook.module';
import { BotModule } from './bot/bot.module';
import { CustomerModule } from './customer/customer.module';
import { MessageModule } from './message/message.module';
import { RedisModule } from './redis/redis.module';
import { JobsModule } from './jobs/jobs.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    WordModule,
    PrismaModule,
    BotModule,
    WebhookModule,
    CustomerModule,
    MessageModule,
    RedisModule,
    JobsModule
  ]
})
export class AppModule {}
