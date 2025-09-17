import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody
} from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { TelegramWebhookBodyDto } from './dto';
import { TelegramWebhookApiResponseDto } from './dto/telegram-webhook-api-response.dto';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService
  ) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Telegram webhook'
  })
  @ApiBody({
    type: TelegramWebhookBodyDto,
    description: 'Telegram webhook payload'
  })
  @ApiResponse({
    status: 200,
    description:
      'Webhook processed successfully.',
    type: TelegramWebhookApiResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.'
  })
  async webhook(
    @Body() dto: TelegramWebhookBodyDto
  ): Promise<TelegramWebhookApiResponseDto> {
    await this.webhookService.getTelegramWebhook(
      dto
    );
    return { status: 'ok' };
  }
}
