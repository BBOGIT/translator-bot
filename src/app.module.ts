import {
  ConfigModule,
  ConfigService
} from '@nestjs/config';
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
import { FlowEditorModule } from './flow-editor/flow-editor.module';
import { TelegramModule } from './telegram/telegram.module';
import { AiModule } from './ai/ai.module';
import {
  APP_FILTER,
  APP_INTERCEPTOR
} from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ErrorHandlingInterceptor } from './common/interceptors/error-handling.interceptor';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from './cache/cache.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.prod'
          : '.env'
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService
      ) => {
        const isProduction =
          configService.get('NODE_ENV') ===
          'production';
        return {
          pinoHttp: {
            level: isProduction
              ? 'info'
              : 'debug',
            transport: isProduction
              ? undefined
              : { target: 'pino-pretty' },
            formatters: {
              level: label => {
                return { level: label };
              }
            },
            redact: ['req.headers.authorization']
          }
        };
      }
    }),
    PrometheusModule.register({
      defaultLabels: {
        app: 'translator-bot',
        version:
          process.env.npm_package_version ||
          '0.0.0'
      },
      path: '/api/metrics',
      defaultMetrics: {
        enabled: false
      }
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
    JobsModule,
    FlowEditorModule,
    TelegramModule,
    AiModule,
    CacheModule,
    MetricsModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor
    }
  ]
})
export class AppModule {}
