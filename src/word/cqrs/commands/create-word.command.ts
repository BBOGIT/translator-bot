export class CreateWordCommand {
  constructor(
    public readonly word: string,
    public readonly translation: string,
    public readonly customerId: number,
    public readonly examples?: string | string[],
    public readonly needToLearn?: boolean,
    public readonly videoExample?: string,
    public readonly imageExample?: string
  ) {}
}

/**
 * Результат виконання команди створення слова
 */
export class CreateWordResult {
  constructor(
    public readonly id: number,
    public readonly word: string,
    public readonly translation: string,
    public readonly customerId: number
  ) {}
}
