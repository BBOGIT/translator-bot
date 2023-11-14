import {
  Body,
  Controller,
  Post
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { TelegramWebhookBodyDto } from './dto';

@Controller('webhook')
export class WebhookController {
  constructor(
    private webhookService: WebhookService
  ) {}

  @Post('telegram')
  webhook(@Body() dto: TelegramWebhookBodyDto) {
    return this.webhookService.getTelegramWebhook(
      dto
    );
  }
}
