import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CustomerService } from 'src/customer/customer.service';

@Module({
  imports: [PrismaModule],
  providers: [BotService, CustomerService]
})
export class BotModule {}
