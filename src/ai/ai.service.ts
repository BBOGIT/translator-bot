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
import { AIServiceError } from './errors/ai.errors';

@Injectable()
export class AiService {
  private readonly logger = new Logger(
    AiService.name
  );
  private readonly provider: IAIProvider;

  constructor(
    private readonly config: AIConfig,
    private readonly openAIService: OpenAIService,
    private readonly deepseekService: DeepseekService
  ) {
    this.provider = this.getProvider();
    this.logProviderInitialization();
  }

  async processText(
    text: string
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
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

      // Log pre-processing state
      this.logger.debug('Pre-processing checks', {
        isTextEmpty: !text,
        isProviderReady: !!this.provider,
        providerType: this.config.provider
      });

      const response =
        await this.provider.processText(text);

      // Log response details
      this.logger.debug(
        'Text processing completed',
        {
          processingTime: Date.now() - startTime,
          responseDetails: {
            hasTranslation:
              !!response.translation,
            translationLength:
              response.translation?.length,
            hasExamples: !!response.examples,
            examplesCount:
              response.examples?.length
          }
        }
      );

      return response;
    } catch (error) {
      // Enhanced error logging
      this.logger.error(
        'Text processing failed',
        {
          error,
          errorType: error.constructor.name,
          errorMessage: error.message,
          errorStack: error.stack,
          processingTime: Date.now() - startTime,
          providerDetails: {
            type: this.config.provider
          },
          requestDetails: {
            textLength: text.length,
            timestamp: new Date().toISOString()
          }
        }
      );

      throw new AIServiceError(
        `Failed to process text: ${error.message}`,
        error
      );
    }
  }

  async processImage(
    imageBuffer: Buffer
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
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

        throw new AIServiceError(
          `Image size (${imageBuffer.length} bytes) exceeds maximum allowed size (${this.config.getImageConfig.maxSize} bytes)`
        );
      }

      const response =
        await this.provider.processImage(
          imageBuffer
        );

      return response;
    } catch (error) {
      // Enhanced error logging for image processing
      this.logger.error(
        'Image processing failed',
        {
          errorType: error.constructor.name,
          errorMessage: error.message,
          errorStack: error.stack,
          error,
          processingTime: Date.now() - startTime,
          imageDetails: {
            size: imageBuffer.length,
            maxAllowedSize:
              this.config.getImageConfig.maxSize
          },
          providerDetails: {
            type: this.config.provider,
            config: this.getProviderConfig()
          }
        }
      );

      throw new AIServiceError(
        `Failed to process image: ${error.message}`,
        error
      );
    }
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
      throw error;
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
