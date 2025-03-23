import { NotFoundException } from '@nestjs/common';

export class CustomerNotFoundException extends NotFoundException {
  constructor(chatId: string) {
    super(
      `Customer with chatId ${chatId} not found`
    );
  }
}
