import { AIResponse } from './ai-response.interface';

/**
 * Інтерфейс для кешування AI відповідей
 * Визначає методи для роботи з кешем AI запитів та відповідей
 */
export interface AICacheInterface {
  /**
   * Отримати кешовану відповідь для текстового запиту
   * @param text Текст для перекладу
   * @param provider Провайдер AI (openai, deepseek)
   * @returns Кешована відповідь або null
   */
  getTextResponse(
    text: string,
    provider: string
  ): Promise<AIResponse | null>;

  /**
   * Зберегти відповідь для текстового запиту в кеш
   * @param text Текст запиту
   * @param provider Провайдер AI
   * @param response Відповідь від AI
   * @param ttl Час життя кешу в секундах (опціонально)
   */
  setTextResponse(
    text: string,
    provider: string,
    response: AIResponse,
    ttl?: number
  ): Promise<void>;

  /**
   * Отримати кешовану відповідь для зображення
   * @param imageHash Хеш зображення
   * @param provider Провайдер AI
   * @returns Кешована відповідь або null
   */
  getImageResponse(
    imageHash: string,
    provider: string
  ): Promise<AIResponse | null>;

  /**
   * Зберегти відповідь для зображення в кеш
   * @param imageHash Хеш зображення
   * @param provider Провайдер AI
   * @param response Відповідь від AI
   * @param ttl Час життя кешу в секундах (опціонально)
   */
  setImageResponse(
    imageHash: string,
    provider: string,
    response: AIResponse,
    ttl?: number
  ): Promise<void>;

  /**
   * Отримати кешовані regex паттерни для каналу
   * @param content Контент повідомлення
   * @param channelId ID каналу
   * @param provider Провайдер AI
   * @returns Кешовані паттерни або null
   */
  getRegexPatterns(
    content: string,
    channelId: string,
    provider: string
  ): Promise<{
    wordRegex: string;
    translationRegex: string;
    examplesRegex: string;
    confidence: number;
  } | null>;

  /**
   * Зберегти regex паттерни в кеш
   * @param content Контент повідомлення
   * @param channelId ID каналу
   * @param provider Провайдер AI
   * @param patterns Паттерни для збереження
   * @param ttl Час життя кешу в секундах (опціонально)
   */
  setRegexPatterns(
    content: string,
    channelId: string,
    provider: string,
    patterns: {
      wordRegex: string;
      translationRegex: string;
      examplesRegex: string;
      confidence: number;
    },
    ttl?: number
  ): Promise<void>;

  /**
   * Очистити кеш для конкретного провайдера
   * @param provider Провайдер AI
   */
  clearProviderCache(
    provider: string
  ): Promise<void>;

  /**
   * Очистити весь AI кеш
   */
  clearAll(): Promise<void>;
}
