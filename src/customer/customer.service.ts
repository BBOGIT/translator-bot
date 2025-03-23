// src/customer/customer.service.ts
import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CustomerDto,
  CustomerUpdateDto,
  CustomerFindDto
} from './dto';
import { Customer } from './types/customer.type';
import { CustomerRepository } from './repositories/customer.repository';
import { CustomerState } from './enum';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(
    CustomerService.name
  );

  constructor(
    private readonly customerRepository: CustomerRepository
  ) {}

  async find(
    dto: CustomerFindDto
  ): Promise<Customer | null> {
    return await this.customerRepository.find(
      dto.chatId
    );
  }

  async create(
    dto: CustomerDto
  ): Promise<Customer> {
    return await this.customerRepository.create({
      ...dto,
      state:
        dto.state || CustomerState.WelcomeMessage
    });
  }

  async update(
    dto: CustomerUpdateDto
  ): Promise<Customer> {
    return await this.customerRepository.update(
      dto
    );
  }
}
