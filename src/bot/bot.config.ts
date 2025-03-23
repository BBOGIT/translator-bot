import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotConfig {
  // Базові налаштування бота
  readonly supportedLanguages = ['uk'];
  readonly defaultLanguage = 'uk';
  readonly redisKeyExpiration = 3600;

  // Загальні налаштування для AI сервісів
  readonly aiConfig: {
    provider: 'deepseek' | 'openai';
    maxRetries: number;
    retryDelay: number;
  };

  // Специфічні налаштування для Deepseek API
  readonly deepseekConfig: {
    apiUrl: string;
    apiKey: string;
    maxRetries: number;
    timeout: number;
  };

  // Специфічні налаштування для OpenAI API
  readonly openAIConfig: {
    apiUrl: string;
    apiKey: string;
    model: string;
    timeout: number;
  };

  // Налаштування для обробки зображень
  readonly imageConfig: {
    maxSizeBytes: number;
    allowedMimeTypes: string[];
    maxProcessingTime: number;
  };

  constructor(
    private configService: ConfigService
  ) {
    // Ініціалізуємо загальні налаштування AI
    this.aiConfig = {
      // Визначаємо провайдера з змінних середовища або використовуємо значення за замовчуванням
      provider: this.configService.get<
        'deepseek' | 'openai'
      >('AI_PROVIDER', 'deepseek'),
      maxRetries: this.configService.get<number>(
        'MAX_RETRIES',
        3
      ),
      retryDelay: this.configService.get<number>(
        'RETRY_DELAY',
        1000
      )
    };

    // Ініціалізуємо конфігурацію Deepseek API
    this.deepseekConfig = {
      apiUrl: this.configService.get<string>(
        'DEEPSEEK_API_URL'
      ),
      apiKey: this.configService.get<string>(
        'DEEPSEEK_API_KEY'
      ),
      maxRetries: this.configService.get<number>(
        'DEEPSEEK_MAX_RETRIES',
        3
      ),
      timeout: this.configService.get<number>(
        'DEEPSEEK_TIMEOUT',
        30000
      )
    };

    // Ініціалізуємо конфігурацію OpenAI API
    this.openAIConfig = {
      apiUrl: this.configService.get<string>(
        'OPENAI_API_URL',
        'https://api.openai.com'
      ),
      apiKey: this.configService.get<string>(
        'OPENAI_API_KEY'
      ),
      model: this.configService.get<string>(
        'OPENAI_MODEL',
        'gpt-4'
      ),
      timeout: this.configService.get<number>(
        'OPENAI_TIMEOUT',
        30000
      )
    };

    // Налаштування для обробки зображень
    this.imageConfig = {
      maxSizeBytes:
        this.configService.get<number>(
          'MAX_IMAGE_SIZE',
          5 * 1024 * 1024
        ),
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp'
      ],
      maxProcessingTime:
        this.configService.get<number>(
          'IMAGE_PROCESSING_TIMEOUT',
          60000
        )
    };

    // Валідуємо конфігурацію при створенні екземпляра
    this.validate();
  }

  // Метод для комплексної валідації конфігурації
  validate(): void {
    // Перевіряємо налаштування мови
    if (
      !this.supportedLanguages.includes(
        this.defaultLanguage
      )
    ) {
      throw new Error(
        'Default language must be in supported languages'
      );
    }

    // Перевіряємо конфігурацію відповідно до вибраного провайдера
    if (this.aiConfig.provider === 'deepseek') {
      if (
        !this.deepseekConfig.apiUrl ||
        !this.deepseekConfig.apiKey
      ) {
        throw new Error(
          'Missing required Deepseek API configuration'
        );
      }
    } else if (
      this.aiConfig.provider === 'openai'
    ) {
      if (
        !this.openAIConfig.apiUrl ||
        !this.openAIConfig.apiKey
      ) {
        throw new Error(
          'Missing required OpenAI API configuration'
        );
      }
    }
  }

  // Метод для отримання конфігурації поточного AI провайдера
  getCurrentAIConfig() {
    return this.aiConfig.provider === 'deepseek'
      ? this.deepseekConfig
      : this.openAIConfig;
  }

  // Метод для перевірки типу зображення
  isAllowedImageType(mimeType: string): boolean {
    return this.imageConfig.allowedMimeTypes.includes(
      mimeType
    );
  }

  // Метод для перевірки розміру зображення
  isAllowedImageSize(sizeBytes: number): boolean {
    return (
      sizeBytes <= this.imageConfig.maxSizeBytes
    );
  }

  // Метод для отримання налаштувань обробки зображень
  getImageConfig() {
    return this.imageConfig;
  }

  // Метод для отримання конфігурації повторних спроб
  getRetryConfig() {
    return {
      maxRetries: this.aiConfig.maxRetries,
      retryDelay: this.aiConfig.retryDelay
    };
  }
}
