import { Word, Customer } from '@prisma/client';

/**
 * Запит на отримання слів для повторення
 */
export class GetWordsForRepetitionQuery {
  constructor(
    public readonly customerId?: number
  ) {}
}

/**
 * Тип для слова з інформацією про користувача
 */
export type WordWithCustomer = Word & {
  customer: Customer;
};

/**
 * Результат запиту отримання слів для повторення
 */
export class GetWordsForRepetitionResult {
  constructor(
    public readonly words: WordWithCustomer[]
  ) {}
}
