import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BotService } from 'src/bot/bot.service';
import { CustomerService } from 'src/customer/customer.service';
import { MessageService } from 'src/message/message.service';

@Module({
  imports: [PrismaModule],
  controllers: [WebhookController],
  providers: [
    BotService,
    WebhookService,
    CustomerService,
    MessageService
  ]
})
export class WebhookModule {}
