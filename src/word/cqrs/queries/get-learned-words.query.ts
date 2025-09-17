import { Word } from '@prisma/client';

export class GetLearnedWordsQuery {
  constructor(
    public readonly customerId: number,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {}
}

/**
 * Результат запиту отримання вивчених слів
 */
export interface PaginatedWordsResult {
  words: Pick<
    Word,
    'id' | 'word' | 'translation' | 'updatedAt'
  >[];
  total: number;
  pages: number;
}
