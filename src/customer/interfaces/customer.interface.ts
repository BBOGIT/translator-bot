import { Word } from '@prisma/client';
import {
  CustomerDto,
  CustomerUpdateDto
} from '../dto/customer.dto';
import { CustomerState } from '../enum';
import { Customer } from '../types/customer.type';

export interface ICustomerResponse {
  id: number;
  chatId: string;
  state: CustomerState;
  firstName?: string | null;
  lastName?: string | null;
  channel?: string | null;
  words?: Word[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerRepository {
  find(chatId: string): Promise<Customer | null>;
  create(data: CustomerDto): Promise<Customer>;
  update(
    data: CustomerUpdateDto
  ): Promise<Customer>;
}
