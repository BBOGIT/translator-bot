/**
 * Команда для оновлення часу останнього сповіщення про слово
 */
export class UpdateWordNotificationCommand {
  constructor(public readonly wordId: number) {}
}

/**
 * Результат оновлення часу останнього сповіщення
 */
export class UpdateWordNotificationResult {
  constructor(
    public readonly id: number,
    public readonly lastNotificationAt: Date
  ) {}
}
