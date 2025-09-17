// src/telegram/telegram.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { TelegramApiClient } from './telegram-api.client';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TelegramService, TelegramApiClient],
  exports: [TelegramService, TelegramApiClient]
})
export class TelegramModule {}
