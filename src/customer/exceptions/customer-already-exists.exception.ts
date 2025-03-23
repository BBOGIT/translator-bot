import { ConflictException } from '@nestjs/common';
import { CUSTOMER_ERROR_MESSAGES } from '../constants/customer.constants';

export class CustomerAlreadyExistsException extends ConflictException {
  constructor(chatId: string) {
    super(
      CUSTOMER_ERROR_MESSAGES.ALREADY_EXISTS(
        chatId
      )
    );
  }
}
