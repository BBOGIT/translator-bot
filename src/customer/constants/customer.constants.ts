export const CUSTOMER_ERROR_MESSAGES = {
  NOT_FOUND: (chatId: string) =>
    `Customer with chatId ${chatId} not found`,
  ALREADY_EXISTS: (chatId: string) =>
    `Customer with chatId ${chatId} already exists`,
  CREATE_FAILED: 'Failed to create customer',
  UPDATE_FAILED: 'Failed to update customer',
  FIND_FAILED: 'Failed to find customer'
} as const;
