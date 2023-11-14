import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [PrismaModule, BotModule],
  providers: [CustomerService]
})
export class CustomerModule {}
