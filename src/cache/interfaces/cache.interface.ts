/**
 * Інтерфейс для сервісів кешування
 */
export interface CacheInterface {
  /**
   * Отримати дані з кешу
   * @param key Ключ кешу
   * @returns Дані або null, якщо дані відсутні або застарілі
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Зберегти дані в кеш
   * @param key Ключ кешу
   * @param data Дані для збереження
   * @param ttl Час життя в секундах або мілісекундах (залежить від реалізації)
   */
  set<T>(
    key: string,
    data: T,
    ttl?: number
  ): Promise<void>;

  /**
   * Видалити запис з кешу
   * @param key Ключ кешу
   */
  delete(key: string): Promise<void>;

  /**
   * Видалити записи з кешу за шаблоном ключа
   * @param pattern Шаблон ключа
   */
  deleteByPattern(
    pattern: string
  ): Promise<number>;

  /**
   * Очистити весь кеш
   */
  clear(): Promise<void>;

  /**
   * Повернути значення з кешу або викликати функцію, якщо кеш відсутній
   * @param key Ключ кешу
   * @param fetchFn Функція для отримання даних
   * @param ttl Час життя в секундах або мілісекундах (залежить від реалізації)
   */
  getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T>;
}
