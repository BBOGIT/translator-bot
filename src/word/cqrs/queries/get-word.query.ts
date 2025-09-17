import { Word } from '@prisma/client';

export class GetWordQuery {
  constructor(
    public readonly word: string,
    public readonly customerId: number
  ) {}
}

/**
 * Результат запиту отримання слова
 */
export class GetWordResult {
  constructor(public readonly word: Word) {}
}
