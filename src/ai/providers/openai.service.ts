import {
  Injectable,
  Logger,
  Inject
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { AIConfig } from '../config/ai.config';
import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AIResponse } from '../interfaces/ai-response.interface';
import { AIProviderError } from '../../common/errors/domain-errors';
import { CacheInterface } from '../../cache/interfaces/cache.interface';
import { createHash } from 'crypto';
import { MetricsService } from '../../common/metrics/metrics.service';

@Injectable()
export class OpenAIService
  implements IAIProvider
{
  private readonly logger = new Logger(
    OpenAIService.name
  );
  private readonly openai: OpenAI;

  constructor(
    private readonly config: AIConfig,
    @Inject('CACHE_SERVICE')
    private readonly cacheService: CacheInterface,
    private readonly metricsService: MetricsService
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.openAIConfig.apiKey
    });
  }

  /**
   * Створює хеш для кешування запитів
   */
  private createCacheKey(text: string): string {
    const hash = createHash('md5')
      .update(text)
      .digest('hex');
    return `ai:openai:text:${hash}`;
  }

  async processText(
    text: string
  ): Promise<AIResponse> {
    const cacheKey = this.createCacheKey(text);
    let isCacheHit = true; // Assume cache hit initially

    try {
      const result =
        await this.cacheService.getOrSet<AIResponse>(
          cacheKey,
          async () => {
            this.logger.debug(
              `Cache miss for text: "${text.substring(0, 30)}..."`
            );
            isCacheHit = false; // Set to false if cache miss

            const processingStartTime =
              Date.now();
            try {
              const messages: ChatCompletionMessageParam[] =
                [
                  {
                    role: 'system',
                    content: `You are a translator assistant. Always respond in the following JSON format: 
                        { "extractedText": "The word in English",
                          "translation": "Ukrainian translation of the text",
                          "examples": ["example1 in English", "example2 in English", "example3 in English"]
                        }`
                  },
                  {
                    role: 'user',
                    content: `Translate this English text to Ukrainian and provide usage examples: "${text}"`
                  }
                ];
              const apiStartTime = Date.now();

              const completion =
                await this.openai.chat.completions.create(
                  {
                    model:
                      this.config.openAIConfig
                        .model,
                    messages,
                    max_tokens:
                      this.config.openAIConfig
                        .maxTokens,
                    temperature:
                      this.config.openAIConfig
                        .temperature,
                    response_format: {
                      type: 'json_object'
                    }
                  }
                );

              const apiResponseTime =
                Date.now() - apiStartTime;
              this.metricsService.observeAiResponseTime(
                'openai',
                'text_processing',
                apiResponseTime
              );

              const content =
                completion.choices[0]?.message
                  ?.content;
              if (!content) {
                this.metricsService.incrementErrors(
                  'ai',
                  'empty_response'
                );
                const errorMessage =
                  'Empty response from OpenAI';
                throw new AIProviderError(
                  'OpenAI',
                  errorMessage,
                  {
                    errorCode:
                      'OPENAI_EMPTY_RESPONSE',
                    reportable: false
                  }
                );
              }

              try {
                const json = JSON.parse(content);
                if (
                  json.examples &&
                  typeof json.examples ===
                    'string'
                ) {
                  json.examples = json.examples
                    .split(',')
                    .map(e => e.trim());
                }
                const totalProcessingTime =
                  Date.now() -
                  processingStartTime;
                this.metricsService.observeAiResponseTime(
                  'openai',
                  'total_processing',
                  totalProcessingTime
                );
                this.metricsService.incrementTranslations(
                  'text',
                  'en_to_uk'
                );
                return {
                  extractedText:
                    json.extractedText || text,
                  translation: json.translation,
                  examples: Array.isArray(
                    json.examples
                  )
                    ? json.examples
                    : []
                };
              } catch (parseError) {
                this.metricsService.incrementErrors(
                  'ai',
                  'json_parse_error'
                );
                const errorMessage =
                  'Failed to parse JSON response from OpenAI';
                throw new AIProviderError(
                  'OpenAI',
                  errorMessage,
                  {
                    cause: parseError,
                    errorCode:
                      'OPENAI_PARSE_ERROR',
                    reportable: true
                  }
                );
              }
            } catch (error) {
              // This catch is for errors from openai.chat.completions.create or parsing
              this.metricsService.incrementErrors(
                'ai',
                'api_error'
              );
              // Check if it's already an AIProviderError (from empty content or parse error)
              if (
                error instanceof AIProviderError
              ) {
                throw error;
              }
              // Otherwise, wrap it
              const errorMessage =
                error.message ||
                'OpenAI API request failed';
              throw new AIProviderError(
                'OpenAI',
                errorMessage,
                {
                  cause: error,
                  errorCode: 'OPENAI_API_ERROR', // More generic, or inspect OpenAI error type
                  reportable: true
                }
              );
            }
          },
          this.config.cacheTTL
        );

      if (isCacheHit && result) {
        // Check result as getOrSet might return undefined if key not found and factory fails
        this.logger.debug(
          `Cache hit for text: "${text.substring(0, 30)}..."`,
          { cacheKey }
        );
      }
      // If it was a cache miss, isCacheHit is false, logged inside factory.

      return result;
    } catch (error) {
      // This is the outermost catch
      const finalError =
        error instanceof AIProviderError
          ? error
          : new AIProviderError(
              'OpenAI',
              error.message ||
                'Unknown error in processText',
              {
                cause: error,
                reportable: true,
                errorCode:
                  'OPENAI_PROCESS_TEXT_FAILED'
              }
            );
      this.logger.error(
        `Error processing text with OpenAI: ${finalError.message}`,
        {
          error: finalError,
          textLength: text.length
        }
      );
      throw finalError;
    }
  }

  /**
   * Generate regex patterns for extracting content from channel messages
   */
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
    const cacheKey = this.createCacheKey(
      `regex_patterns:${content}`
    );

    try {
      const result =
        await this.cacheService.getOrSet(
          cacheKey,
          async () => {
            this.logger.debug(
              'Generating regex patterns with OpenAI'
            );

            const messages: ChatCompletionMessageParam[] =
              [
                {
                  role: 'system',
                  content: `You are an expert at creating JavaScript regular expressions for text extraction.
              
              Analyze Telegram channel messages that teach English words and create precise regex patterns to extract:
              1. The English word being taught
              2. The translation(s) in Ukrainian/Russian  
              3. The usage examples with translations
              
              Return ONLY valid JSON in this exact format:
              {
                "wordRegex": "regex_pattern_with_capture_group",
                "translationRegex": "regex_pattern_with_capture_group", 
                "examplesRegex": "regex_pattern_with_capture_group",
                "confidence": 0.95
              }
              
              Use capture groups () to extract the main content. Make patterns flexible for similar message formats.
              The confidence should be between 0.0 and 1.0 based on how well the patterns will work.
              IMPORTANT: For emoji-based patterns, do NOT hardcode specific emoji codepoints. Use a broad character class that includes the entire relevant Unicode block (e.g. all cat-face emoji [😸-😿], all emoticons [😀-😿]) so the pattern still matches when the channel uses a different emoji from the same category.`
                },
                {
                  role: 'user',
                  content: `Channel: ${channelInfo?.title || channelInfo?.username || 'Unknown'}

Message content to analyze:
"${content}"

Create regex patterns to extract the word, translation, and examples from this message format. Focus on the structure and delimiters used.`
                }
              ];

            const completion =
              await this.openai.chat.completions.create(
                {
                  model:
                    this.config.openAIConfig
                      .model,
                  messages,
                  max_tokens: 500,
                  temperature: 0.3,
                  response_format: {
                    type: 'json_object'
                  }
                }
              );

            const responseContent =
              completion.choices[0]?.message
                ?.content;
            if (!responseContent) {
              throw new Error(
                'No response from OpenAI'
              );
            }

            const parsed = JSON.parse(
              responseContent
            );

            // Validate response structure
            if (
              !parsed.wordRegex ||
              !parsed.translationRegex ||
              !parsed.examplesRegex
            ) {
              throw new Error(
                'Invalid response format from OpenAI'
              );
            }

            return {
              wordRegex: parsed.wordRegex,
              translationRegex:
                parsed.translationRegex,
              examplesRegex: parsed.examplesRegex,
              confidence: parsed.confidence || 0.5
            };
          },
          300 // Cache for 5 minutes
        );

      return result;
    } catch (error) {
      this.logger.error(
        'Error generating regex patterns',
        {
          error: error.message,
          channelInfo,
          contentLength: content.length
        }
      );

      // Fallback patterns based on the example message format
      return {
        wordRegex:
          '(?:😼|🔤)\\s*([a-zA-Z]+)\\s*-',
        translationRegex:
          '-\\s*([^\\n]+?)(?:\\n|$)',
        examplesRegex:
          '([0-9]️⃣[\\s\\S]*?)(?:\\n\\n[A-Z]|$)',
        confidence: 0.3
      };
    }
  }

  /**
   * Створює хеш для кешування запитів з зображеннями
   */
  private createImageCacheKey(
    imageBuffer: Buffer
  ): string {
    const hash = createHash('md5')
      .update(imageBuffer)
      .digest('hex');
    return `ai:openai:image:${hash}`;
  }

  async processImage(
    imageBuffer: Buffer
  ): Promise<AIResponse> {
    const cacheKey =
      this.createImageCacheKey(imageBuffer);
    let isCacheHit = true; // Assume cache hit

    try {
      const result =
        await this.cacheService.getOrSet<AIResponse>(
          cacheKey,
          async () => {
            this.logger.debug(
              'Cache miss for image'
            );
            isCacheHit = false; // Set to false on cache miss

            const processingStartTime =
              Date.now();
            try {
              const apiStartTime = Date.now();
              const imageUrl = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
              const messages: ChatCompletionMessageParam[] =
                [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'What does the image say or show? Extract text if any. Respond in JSON format: { "extractedText": "text from image", "translation": "(leave empty)", "examples": [] }'
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: imageUrl
                        }
                      }
                    ]
                  }
                ];

              const completion =
                await this.openai.chat.completions.create(
                  {
                    model:
                      this.config.openAIConfig
                        .imageModel ||
                      'gpt-4-vision-preview',
                    messages,
                    max_tokens:
                      this.config.openAIConfig
                        .imageMaxTokens || 1000,
                    temperature:
                      this.config.openAIConfig
                        .temperature || 0.2
                  }
                );

              const apiResponseTime =
                Date.now() - apiStartTime;
              this.metricsService.observeAiResponseTime(
                'openai',
                'image_processing',
                apiResponseTime
              );

              const content =
                completion.choices[0]?.message
                  ?.content;
              if (!content) {
                this.metricsService.incrementErrors(
                  'ai',
                  'image_empty_response'
                );
                const errorMessage =
                  'Empty response from OpenAI for image processing';
                throw new AIProviderError(
                  'OpenAI',
                  errorMessage,
                  {
                    errorCode:
                      'OPENAI_IMAGE_EMPTY_RESPONSE',
                    reportable: false
                  }
                );
              }

              try {
                const json = JSON.parse(content);
                const totalProcessingTime =
                  Date.now() -
                  processingStartTime;
                this.metricsService.observeAiResponseTime(
                  'openai',
                  'image_total_processing',
                  totalProcessingTime
                );
                this.metricsService.incrementTranslations(
                  'image',
                  'ocr'
                );
                return {
                  extractedText:
                    json.extractedText || '',
                  translation:
                    json.translation || '',
                  examples: Array.isArray(
                    json.examples
                  )
                    ? json.examples
                    : []
                };
              } catch (parseError) {
                this.metricsService.incrementErrors(
                  'ai',
                  'image_json_parse_error'
                );
                const errorMessage =
                  'Failed to parse JSON response from OpenAI for image processing';
                throw new AIProviderError(
                  'OpenAI',
                  errorMessage,
                  {
                    cause: parseError,
                    errorCode:
                      'OPENAI_IMAGE_PARSE_ERROR',
                    reportable: true
                  }
                );
              }
            } catch (error) {
              // Catch for errors from openai.chat.completions.create or parsing
              this.metricsService.incrementErrors(
                'ai',
                'image_api_error'
              );
              if (
                error instanceof AIProviderError
              ) {
                throw error;
              }
              const errorMessage =
                error.message ||
                'OpenAI API image request failed';
              throw new AIProviderError(
                'OpenAI',
                errorMessage,
                {
                  cause: error,
                  errorCode:
                    'OPENAI_IMAGE_API_ERROR',
                  reportable: true
                }
              );
            }
          },
          this.config.cacheTTL
        );

      if (isCacheHit && result) {
        this.logger.debug('Cache hit for image', {
          cacheKey
        });
      }

      return result;
    } catch (error) {
      // Outermost catch
      const finalError =
        error instanceof AIProviderError
          ? error
          : new AIProviderError(
              'OpenAI',
              error.message ||
                'Unknown error in processImage',
              {
                cause: error,
                reportable: true,
                errorCode:
                  'OPENAI_PROCESS_IMAGE_FAILED'
              }
            );
      this.logger.error(
        `Error processing image with OpenAI: ${finalError.message}`,
        {
          error: finalError,
          imageSize: imageBuffer.length
        }
      );
      throw finalError;
    }
  }
}
