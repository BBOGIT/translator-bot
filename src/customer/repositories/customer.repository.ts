// src/customer/repositories/customer.repository.ts
import {
  Injectable,
  Logger
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CustomerDto,
  CustomerUpdateDto
} from '../dto';
import { Customer } from '../types/customer.type';
import { CustomerMapper } from '../mappers/customer.mapper';
import {
  CustomerNotFoundException,
  CustomerAlreadyExistsException
} from '../exceptions';
import { CUSTOMER_ERROR_MESSAGES } from '../constants/customer.constants';

@Injectable()
export class CustomerRepository {
  private readonly logger = new Logger(
    CustomerRepository.name
  );

  constructor(
    private readonly prisma: PrismaService
  ) {}

  async find(
    chatId: string
  ): Promise<Customer | null> {
    try {
      const customer =
        await this.prisma.customer.findUnique({
          where: { chatId },
          include: { Word: true }
        });

      return customer
        ? CustomerMapper.toDomain(customer)
        : null;
    } catch (error) {
      this.logger.error(
        `Repository: ${CUSTOMER_ERROR_MESSAGES.FIND_FAILED}`,
        error.stack
      );
      throw error;
    }
  }

  async create(
    dto: CustomerDto
  ): Promise<Customer> {
    try {
      const customer =
        await this.prisma.customer.create({
          data: { ...dto },
          include: { Word: true }
        });

      return CustomerMapper.toDomain(customer);
    } catch (error) {
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new CustomerAlreadyExistsException(
            dto.chatId
          );
        }
      }
      this.logger.error(
        `Repository: ${CUSTOMER_ERROR_MESSAGES.CREATE_FAILED}`,
        error.stack
      );
      throw error;
    }
  }

  async update(
    dto: CustomerUpdateDto
  ): Promise<Customer> {
    try {
      const customer =
        await this.prisma.customer.update({
          where: { chatId: dto.chatId },
          data: { ...dto },
          include: { Word: true }
        });

      return CustomerMapper.toDomain(customer);
    } catch (error) {
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2025') {
          throw new CustomerNotFoundException(
            dto.chatId
          );
        }
      }
      this.logger.error(
        `Repository: ${CUSTOMER_ERROR_MESSAGES.UPDATE_FAILED}`,
        error.stack
      );
      throw error;
    }
  }
}
