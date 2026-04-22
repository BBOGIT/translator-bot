import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  AIConfig,
  AIProvider
} from './config/ai.config';
import { OpenAIService } from './providers/openai.service';
import { DeepseekService } from './providers/deepseek.service';
import { IAIProvider } from './interfaces/ai-provider.interface';
import { AIResponse } from './interfaces/ai-response.interface';
import { AIProviderError, ServiceError } from '../common/errors/domain-errors';
import { CatchErrors } from '../common/decorators/catch-errors.decorator';
import { AICacheService } from './services/ai-cache.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(
    AiService.name
  );
  private readonly provider: IAIProvider;

  constructor(
    private readonly config: AIConfig,
    private readonly openAIService: OpenAIService,
    private readonly deepseekService: DeepseekService,
    private readonly cacheService: AICacheService
  ) {
    this.provider = this.getProvider();
    this.logProviderInitialization();
  }

  @CatchErrors({
    errorMessage: 'Failed to process text',
    errorType: ServiceError,
    context: (instance, _, args) => ({
      provider: (instance as any).config.provider,
      textLength: (args[0] as string)?.length,
      timestamp: new Date().toISOString(),
      modelConfig: (instance as any).getModelConfig(),
      maxTokens: (instance as any).getMaxTokens()
    })
  })
  async processText(
    text: string
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // Log input details
    this.logger.debug(
      'Starting text processing',
      {
        provider: this.config.provider,
        textLength: text.length,
        timestamp: new Date().toISOString(),
        configDetails: {
          model: this.getModelConfig(),
          maxTokens: this.getMaxTokens()
        }
      }
    );

    // 🚀 СПОЧАТКУ ПЕРЕВІРЯЄМО КЕШ
    const cachedResponse =
      await this.cacheService.getTextResponse(
        text,
        this.config.provider
      );

    if (cachedResponse) {
      this.logger.debug(
        'Returning cached text response',
        {
          processingTime: Date.now() - startTime,
          cacheHit: true,
          textLength: text.length
        }
      );
      return cachedResponse;
    }

    // Log pre-processing state
    this.logger.debug('Pre-processing checks', {
      isTextEmpty: !text,
      isProviderReady: !!this.provider,
      providerType: this.config.provider,
      cacheHit: false
    });

    // ВИКЛИКАЄМО AI ПРОВАЙДЕР, ЯКЩО НЕМАЄ В КЕШІ
    const response =
      await this.provider.processText(text);

    // 💾 ЗБЕРІГАЄМО ВІДПОВІДЬ В КЕШ
    await this.cacheService.setTextResponse(
      text,
      this.config.provider,
      response
    );

    // Log response details
    this.logger.debug(
      'Text processing completed',
      {
        processingTime: Date.now() - startTime,
        responseDetails: {
          hasTranslation: !!response.translation,
          translationLength:
            response.translation?.length,
          hasExamples: !!response.examples,
          examplesCount: response.examples?.length
        },
        cached: true
      }
    );

    return response;
  }

  /**
   * Generate regex patterns for extracting content from channel messages
   * @param content The message content to analyze
   * @param channelInfo Information about the channel
   * @returns Regex patterns for extraction
   */
  @CatchErrors({
    errorMessage:
      'Failed to generate regex patterns',
    errorType: ServiceError,
    context: (instance, _, args) => ({
      provider: (instance as any).config.provider,
      contentLength: (args[0] as string)?.length,
      timestamp: new Date().toISOString()
    })
  })
  async generateRegexPatterns(
    content: string,
    channelInfo?: {
      title?: string;
      username?: string;
    }
  ): Promise<{
    wordRegex: string;
    translationRegex: string;
    examplesRegex: string;
    confidence: number;
  }> {
    const startTime = Date.now();
    const channelId =
      channelInfo?.username ||
      channelInfo?.title ||
      'unknown';

    this.logger.debug(
      'Starting regex pattern generation',
      {
        provider: this.config.provider,
        contentLength: content.length,
        channelTitle: channelInfo?.title,
        channelId,
        timestamp: new Date().toISOString()
      }
    );

    // 🔍 ПЕРЕВІРЯЄМО КЕШ ДЛЯ REGEX ПАТТЕРНІВ
    const cachedPatterns =
      await this.cacheService.getRegexPatterns(
        content,
        channelId,
        this.config.provider
      );

    if (cachedPatterns) {
      this.logger.debug(
        'Returning cached regex patterns',
        {
          processingTime: Date.now() - startTime,
          cacheHit: true,
          channelId,
          confidence: cachedPatterns.confidence
        }
      );
      return cachedPatterns;
    }

    // ГЕНЕРУЄМО ПАТТЕРНИ ЧЕРЕЗ AI ПРОВАЙДЕР
    const response =
      await this.provider.generateRegexPatterns(
        content,
        channelInfo
      );

    // 💾 ЗБЕРІГАЄМО ПАТТЕРНИ В КЕШ
    await this.cacheService.setRegexPatterns(
      content,
      channelId,
      this.config.provider,
      response
    );

    this.logger.debug(
      'Regex pattern generation completed',
      {
        processingTime: Date.now() - startTime,
        confidence: response.confidence,
        hasWordRegex: !!response.wordRegex,
        hasTranslationRegex:
          !!response.translationRegex,
        hasExamplesRegex:
          !!response.examplesRegex,
        channelId,
        cached: true
      }
    );

    return response;
  }

  @CatchErrors({
    errorMessage: 'Failed to process image',
    errorType: ServiceError,
    context: (instance, _, args) => ({
      provider: (instance as any).config.provider,
      imageSize: (args[0] as Buffer)?.length,
      timestamp: new Date().toISOString(),
      providerConfig: (instance as any).getProviderConfig()
    })
  })
  async processImage(
    imageBuffer: Buffer
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // Log image processing start
    this.logger.debug(
      'Starting image processing',
      {
        provider: this.config.provider,
        imageSize: imageBuffer.length,
        timestamp: new Date().toISOString(),
        imageConfig: this.config.getImageConfig
      }
    );

    // Validate image size
    if (
      !this.config.isAllowedImageSize(
        imageBuffer.length
      )
    ) {
      this.logger.warn(
        'Image size validation failed',
        {
          actualSize: imageBuffer.length,
          maxAllowedSize:
            this.config.getImageConfig.maxSize
        }
      );

      throw new AIProviderError(
        this.config.provider,
        `Image size (${imageBuffer.length} bytes) exceeds maximum allowed size (${this.config.getImageConfig.maxSize} bytes)`
      );
    }

    // 🖼️ СТВОРЮЄМО ХЕШ ЗОБРАЖЕННЯ ДЛЯ КЕШУВАННЯ
    const imageHash =
      this.cacheService.createImageHashFromBuffer(
        imageBuffer
      );

    // 🚀 ПЕРЕВІРЯЄМО КЕШ
    const cachedResponse =
      await this.cacheService.getImageResponse(
        imageHash,
        this.config.provider
      );

    if (cachedResponse) {
      this.logger.debug(
        'Returning cached image response',
        {
          processingTime: Date.now() - startTime,
          cacheHit: true,
          imageHash,
          imageSize: imageBuffer.length
        }
      );
      return cachedResponse;
    }

    // ОБРОБЛЯЄМО ЗОБРАЖЕННЯ ЧЕРЕЗ AI ПРОВАЙДЕР
    const response =
      await this.provider.processImage(
        imageBuffer
      );

    // 💾 ЗБЕРІГАЄМО В КЕШ
    await this.cacheService.setImageResponse(
      imageHash,
      this.config.provider,
      response
    );

    // Log response completion
    this.logger.debug(
      'Image processing completed',
      {
        processingTime: Date.now() - startTime,
        responseDetails: {
          hasTranslation: !!response.translation,
          translationLength:
            response.translation?.length,
          hasExamples: !!response.examples,
          examplesCount: response.examples?.length
        },
        imageHash,
        cached: true
      }
    );

    return response;
  }

  private getProvider(): IAIProvider {
    try {
      switch (this.config.provider) {
        case AIProvider.OPENAI:
          this.logger.debug(
            'Selecting OpenAI provider'
          );
          return this.openAIService;
        case AIProvider.DEEPSEEK:
          this.logger.debug(
            'Selecting Deepseek provider'
          );
          return this.deepseekService;
        default:
          throw new Error(
            `Unsupported AI provider: ${this.config.provider}`
          );
      }
    } catch (error) {
      this.logger.error(
        'Failed to initialize provider',
        {
          provider: this.config.provider,
          error: error.message
        }
      );
      throw new AIProviderError(
        this.config.provider,
        `Failed to initialize AI provider: ${error.message}`
      );
    }
  }

  private getProviderConfig() {
    return this.config.provider ===
      AIProvider.OPENAI
      ? this.config.openAIConfig
      : this.config.deepseekConfig;
  }

  private getModelConfig() {
    return this.config.provider ===
      AIProvider.OPENAI
      ? this.config.openAIConfig.model
      : this.config.deepseekConfig.model;
  }

  private getMaxTokens() {
    return this.config.provider ===
      AIProvider.OPENAI
      ? this.config.openAIConfig.maxTokens
      : this.config.deepseekConfig.maxTokens;
  }

  private logProviderInitialization(): void {
    this.logger.log('Initializing AI service', {
      provider: this.config.provider,
      timestamp: new Date().toISOString()
    });

    const config = this.getProviderConfig();
    this.logger.debug('Provider configuration', {
      provider: this.config.provider,
      config: {
        model: config.model,
        maxTokens: config.maxTokens,
        ...(this.config.provider ===
          AIProvider.OPENAI && {
          imageModel:
            this.config.openAIConfig.imageModel
        }),
        ...(this.config.provider ===
          AIProvider.DEEPSEEK && {
          timeout:
            this.config.deepseekConfig.timeout
        })
      }
    });
  }
}
