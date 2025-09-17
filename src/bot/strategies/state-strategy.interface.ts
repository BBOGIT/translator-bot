import { CommandContext } from '../handlers/core/interfaces';

/**
 * Інтерфейс для стратегій обробки станів користувача
 *
 * Кожна стратегія відповідає за обробку повідомлень користувача у певному стані
 */
export interface StateStrategy {
  /**
   * Назва стратегії для логування та ідентифікації
   */
  readonly name: string;

  /**
   * Обробляє повідомлення користувача і виконує відповідні дії залежно від стану
   *
   * @param context Контекст команди з DTO запиту, даними користувача і сервісами
   * @returns Promise<void>
   */
  handleState(
    context: CommandContext
  ): Promise<void>;

  /**
   * Перевіряє, чи може ця стратегія обробити дане повідомлення в даному стані
   *
   * @param command Текст команди
   * @param context Контекст команди
   * @returns boolean
   */
  canHandle(
    command: string,
    context: CommandContext
  ): boolean;
}
