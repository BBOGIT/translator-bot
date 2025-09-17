export class UpdateWordRepetitionCommand {
  constructor(
    public readonly wordId: number,
    public readonly success: boolean
  ) {}
}

/**
 * Результат виконання команди оновлення статусу повторення слова
 */
export class UpdateWordRepetitionResult {
  constructor(
    public readonly id: number,
    public readonly repeatCount: number,
    public readonly needToLearn: boolean
  ) {}
}
