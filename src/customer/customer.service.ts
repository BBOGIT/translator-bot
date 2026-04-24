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
    const customer = await this.customerRepository.find(dto.chatId);
    if (!customer) return null;
    return this.refreshStreak(customer);
  }

  private async refreshStreak(customer: Customer): Promise<Customer> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = customer.lastActiveDate
      ? new Date(customer.lastActiveDate)
      : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    const alreadyCountedToday =
      lastActive && lastActive.getTime() === today.getTime();
    if (alreadyCountedToday) return customer;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const wasYesterday =
      lastActive && lastActive.getTime() === yesterday.getTime();

    const newStreak = wasYesterday ? customer.streak + 1 : 1;

    return this.customerRepository.update({
      chatId: customer.chatId,
      streak: newStreak,
      lastActiveDate: today,
    });
  }

  async findByChatId(
    chatId: string
  ): Promise<Customer | null> {
    return await this.find({ chatId });
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
