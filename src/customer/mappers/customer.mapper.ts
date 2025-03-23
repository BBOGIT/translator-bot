import { Customer as PrismaCustomer } from '@prisma/client';
import {
  ChannelEnum,
  CustomerState
} from '../enum';
import { Customer } from '../types/customer.type';

export class CustomerMapper {
  static toDomain(
    prismaCustomer: PrismaCustomer & {
      Word?: any[];
    }
  ): Customer {
    return {
      id: prismaCustomer.id,
      chatId: prismaCustomer.chatId,
      state:
        prismaCustomer.state as CustomerState,
      firstName: prismaCustomer.firstName,
      lastName: prismaCustomer.lastName,
      channel:
        prismaCustomer.channel as ChannelEnum,
      createdAt: prismaCustomer.createdAt,
      updatedAt: prismaCustomer.updatedAt,
      words: prismaCustomer.Word
    };
  }
}
