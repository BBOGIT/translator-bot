import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum AIProvider {
  DEEPSEEK = 'deepseek',
  OPENAI = 'openai'
}

export interface OpenAIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  imageModel: string;
  maxTokens: number;
  imageMaxTokens?: number;
  temperature: number;
}

export interface DeepseekConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  imageModel: string;
  timeout: number;
  maxTokens: number;
  temperature: number;
}

export interface ImageConfig {
  maxSize: number; // в байтах
  maxProcessingTime: number; // в мілісекундах
  allowedFormats: string[];
}

@Injectable()
export class AIConfig {
  private readonly imageConfig: ImageConfig = {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxProcessingTime: 30000, // 30 seconds
    allowedFormats: [
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
  };

  constructor(
    private readonly configService: ConfigService
  ) {}

  get provider(): AIProvider {
    const configuredProvider =
      this.configService.get<string>(
        'AI_PROVIDER'
      );
    return this.isValidProvider(
      configuredProvider
    )
      ? configuredProvider
      : AIProvider.DEEPSEEK;
  }

  get cacheTTL(): number {
    return (
      this.configService.get<number>(
        'AI_CACHE_TTL_SECONDS',
        30 * 24 * 60 * 60 // 30 днів в секундах
      ) * 1000 // Перетворюємо в мілісекунди
    );
  }

  get openAIConfig(): OpenAIConfig {
    return {
      apiUrl: this.getRequiredConfig(
        'OPENAI_API_URL'
      ),
      apiKey: this.getRequiredConfig(
        'OPENAI_API_KEY'
      ),
      model: this.configService.get<string>(
        'OPENAI_MODEL',
        'gpt-4o'
      ),
      imageModel: this.configService.get<string>(
        'OPENAI_IMAGE_MODEL',
        'gpt-4o'
      ),
      maxTokens: this.configService.get<number>(
        'OPENAI_MAX_TOKENS',
        500
      ),
      imageMaxTokens:
        this.configService.get<number>(
          'OPENAI_IMAGE_MAX_TOKENS',
          2000
        ),
      temperature: this.configService.get<number>(
        'OPENAI_TEMPERATURE',
        0.7
      )
    };
  }

  get deepseekConfig(): DeepseekConfig {
    return {
      apiUrl: this.getRequiredConfig(
        'DEEPSEEK_API_URL'
      ),
      apiKey: this.getRequiredConfig(
        'DEEPSEEK_API_KEY'
      ),
      model: this.configService.get<string>(
        'DEEPSEEK_MODEL',
        'deepseek-chat'
      ),
      imageModel: this.configService.get<string>(
        'DEEPSEEK_IMAGE_MODEL',
        'deepseek-chat'
      ),
      timeout: this.configService.get<number>(
        'DEEPSEEK_TIMEOUT',
        30000
      ),
      maxTokens: this.configService.get<number>(
        'DEEPSEEK_MAX_TOKENS',
        500
      ),
      temperature: this.configService.get<number>(
        'DEEPSEEK_TEMPERATURE',
        0.7
      )
    };
  }

  get getImageConfig(): ImageConfig {
    return {
      maxSize: this.configService.get<number>(
        'IMAGE_MAX_SIZE',
        this.imageConfig.maxSize
      ),
      maxProcessingTime:
        this.configService.get<number>(
          'IMAGE_MAX_PROCESSING_TIME',
          this.imageConfig.maxProcessingTime
        ),
      allowedFormats: this.configService.get<
        string[]
      >(
        'IMAGE_ALLOWED_FORMATS',
        this.imageConfig.allowedFormats
      )
    };
  }

  private getRequiredConfig<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (!value) {
      throw new Error(
        `Missing required configuration: ${key}`
      );
    }
    return value;
  }

  private isValidProvider(
    provider: string
  ): provider is AIProvider {
    return Object.values(AIProvider).includes(
      provider as AIProvider
    );
  }

  isAllowedImageSize(size: number): boolean {
    return size <= this.imageConfig.maxSize;
  }

  isAllowedImageFormat(format: string): boolean {
    return this.imageConfig.allowedFormats.includes(
      format
    );
  }
}
