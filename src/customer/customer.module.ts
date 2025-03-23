import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './repositories/customer.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    CustomerService,
    CustomerRepository
  ],
  exports: [CustomerService]
})
export class CustomerModule {}
