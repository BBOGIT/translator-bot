import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CustomerService } from 'src/customer/customer.service';
import { MessageService } from 'src/message/message.service';

@Module({
  imports: [PrismaModule],
  providers: [
    BotService,
    CustomerService,
    MessageService
  ]
})
export class BotModule {}
