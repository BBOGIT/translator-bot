import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MessageService } from './message.service';
import { TelegramApiClient } from '../telegram/telegram-api.client';
import { TemplateService } from './template.service';
import { TemplateProcessorService } from './template-processor.service';

@Module({
  imports: [HttpModule],
  providers: [
    MessageService,
    TelegramApiClient,
    TemplateService,
    TemplateProcessorService
  ],
  exports: [MessageService, TemplateService]
})
export class MessageModule {}
