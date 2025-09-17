import { ApiProperty } from '@nestjs/swagger';

export class TelegramWebhookApiResponseDto {
  @ApiProperty({
    description:
      'The status of the webhook processing.',
    example: 'ok'
  })
  status: string;
}
